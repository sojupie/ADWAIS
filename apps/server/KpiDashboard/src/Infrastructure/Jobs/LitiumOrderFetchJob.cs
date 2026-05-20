using Hangfire;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Jobs;

public class LitiumOrderFetchJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IBackgroundJobClient backgroundJobClient,
    ILogger<LitiumOrderFetchJob> logger,
    ISystemEventService eventService)
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

        var fetchInterval = config.LitiumFetchIntervalMinutes;
        var now = DateTimeOffset.UtcNow;

        var tenants = await db.Tenants
            .Where(t => t.OrderFetchingEnabled && t.Id != AnalyticsDbContext.SystemTenantGuid)
            .ToListAsync();

        var dispatched = 0;

        foreach (var tenant in tenants)
        {
            if (tenant.CurrentlyFetching && tenant.LastPolled.HasValue
                && now - tenant.LastPolled.Value > StaleThreshold)
            {
                var msg = $"Tenant {tenant.Id} has stale CurrentlyFetching flag. Resetting.";
                await eventService.LogWarningAsync(nameof(LitiumOrderFetchJob), msg, $"Last polled: {tenant.LastPolled}", tenant.Id);
                tenant.CurrentlyFetching = false;
            }

            if (tenant.CurrentlyFetching)
            {
                logger.LogInformation("Tenant {Id} is currently fetching. Skipping.", tenant.Id);
                continue;
            }

            var start = tenant.FetchedUntil ?? now.AddDays(-2);
            var end = now;

            if (end - start > TimeSpan.FromDays(31))
            {
                var msg = $"Fetch gap too large ({Math.Floor((end - start).TotalDays)} days). Skipping automated sync.";
                await eventService.LogWarningAsync(nameof(LitiumOrderFetchJob), msg, "Automated sync only handles gaps up to 31 days. Use the manual backfill endpoint to recover this tenant.", tenant.Id);
                continue;
            }

            backgroundJobClient.Enqueue<ILitiumIngestionService>(
                litiumIngestionService => litiumIngestionService.ExecuteIngestionAsync(tenant.Id, start, end, CancellationToken.None));

            tenant.CurrentlyFetching = true;
            tenant.LastPolled = now;
            dispatched++;
        }

        config.LastPolled = now;
        await db.SaveChangesAsync();

        logger.LogInformation("Litium dispatch complete. Enqueued {Dispatched}/{Total} tenants.",
            dispatched, tenants.Count);
    }
}
