using Quartz;
using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Infrastructure.Services;

namespace Infrastructure.Jobs;

[DisallowConcurrentExecution]
public class TenantIngestionJob : IJob
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory;
    private readonly ITenantIngestionService _ingestionService;

    public TenantIngestionJob(
        IDbContextFactory<AnalyticsDbContext> contextFactory,
        ITenantIngestionService ingestionService)
    {
        _contextFactory = contextFactory;
        _ingestionService = ingestionService;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var rootContext = await _contextFactory.CreateDbContextAsync(context.CancellationToken);
    
        var tenants = await rootContext.Tenants
            .Where(t => t.Enabled && !t.CurrentlyFetching)
            .ToListAsync(context.CancellationToken);

        var options = new ParallelOptions
        {
            MaxDegreeOfParallelism = 10,
            CancellationToken = context.CancellationToken
        };

        await Parallel.ForEachAsync(tenants, options, async (tenant, ct) =>
        {
            using var localContext = await _contextFactory.CreateDbContextAsync(ct);
            
            await localContext.Database.ExecuteSqlAsync($"UPDATE tenants SET currently_fetching = true WHERE id = {tenant.Id}", ct);

            try
            {
                var since = tenant.FetchedUntil ?? DateTimeOffset.UtcNow.AddDays(-30);
                var until = DateTimeOffset.UtcNow;
                
                using var transaction = await localContext.Database.BeginTransactionAsync(ct);
                try
                {
                    await _ingestionService.ExecuteIngestionAsync(tenant, since, until, ct);
                
                    await localContext.Database.ExecuteSqlAsync(
                        $"UPDATE tenants SET fetched_until = {until} WHERE id = {tenant.Id}", ct);
                
                    await transaction.CommitAsync(ct);
                }
                catch
                {
                    await transaction.RollbackAsync(ct);
                    throw;
                }
            }
            finally
            {
                await localContext.Database.ExecuteSqlAsync(
                    $"UPDATE tenants SET currently_fetching = false, last_polled = NOW() WHERE id = {tenant.Id}", ct);
            }
        });
    }
}