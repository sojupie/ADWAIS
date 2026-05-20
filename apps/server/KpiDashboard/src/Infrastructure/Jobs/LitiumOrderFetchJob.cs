using Hangfire;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Jobs;

public class LitiumOrderFetchJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IBackgroundJobClient backgroundJobClient,
    ILogger<LitiumOrderFetchJob> logger)
{
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromMinutes(60);

    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    [AutomaticRetry(Attempts = 0)]
    public async Task ExecuteAsync()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var config = await db.GlobalConfigs.FirstOrDefaultAsync();

        if (config is null || !config.LitiumFetchEnabled)
        {
            logger.LogInformation("Litium fetching disabled globally. Skipping.");
            return;
        }

        var rateLimit = config.LitiumRateLimit;
        var now = DateTimeOffset.UtcNow;

        var tenants = await db.Tenants
            .Where(t => t.OrderFetchingEnabled && t.Id != AnalyticsDbContext.SystemTenantGuid)
            .ToListAsync();

        var dispatched = 0;

        foreach (var tenant in tenants)
        {
            // Layer 3: Reset stale locks from crashed/dead workers
            if (tenant.CurrentlyFetching && tenant.LastPolled.HasValue
                && now - tenant.LastPolled.Value > StaleThreshold)
            {
                logger.LogWarning(
                    "Tenant {Id} has stale CurrentlyFetching flag (LastPolled: {LastPolled}). Resetting.",
                    tenant.Id, tenant.LastPolled);
                tenant.CurrentlyFetching = false;
            }

            // Layer 2: Skip tenants already being fetched
            if (tenant.CurrentlyFetching)
            {
                logger.LogInformation("Tenant {Id} is currently fetching. Skipping.", tenant.Id);
                continue;
            }

            var start = tenant.FetchedUntil ?? now.AddMinutes(-rateLimit);
            var end = now;

            backgroundJobClient.Enqueue<ITenantIngestionService>(
                svc => svc.ExecuteIngestionAsync(tenant, start, end, CancellationToken.None));

            tenant.FetchedUntil = end;
            tenant.LastPolled = now;
            dispatched++;
        }

        config.LastPolled = now;
        await db.SaveChangesAsync();

        logger.LogInformation("Litium dispatch complete. Enqueued {Dispatched}/{Total} tenants.",
            dispatched, tenants.Count);
    }
}
