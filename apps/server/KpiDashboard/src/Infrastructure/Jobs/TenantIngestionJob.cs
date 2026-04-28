using Quartz;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Domain.Entities;
using Infrastructure.Services;

namespace Infrastructure.Jobs;

[DisallowConcurrentExecution]
public class TenantIngestionJob : IJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TenantIngestionJob> _logger;

    public TenantIngestionJob(
        IServiceScopeFactory scopeFactory, 
        ILogger<TenantIngestionJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var rootScope = _scopeFactory.CreateScope();
        var rootContext = rootScope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();
    
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
            using var tenantScope = _scopeFactory.CreateScope();
            var localContext = tenantScope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();
            var ingestionService = tenantScope.ServiceProvider.GetRequiredService<ITenantIngestionService>();
            
            await localContext.Database.ExecuteSqlAsync($"UPDATE tenants SET currently_fetching = true WHERE id = {tenant.Id}", ct);

            try
            {
                var since = tenant.FetchedUntil ?? DateTimeOffset.UtcNow.AddDays(-30);
                var until = DateTimeOffset.UtcNow;
        
                using var transaction = await localContext.Database.BeginTransactionAsync(ct);
                try
                {
                    await ingestionService.ExecuteIngestionAsync(tenant, since, until, ct);
        
                    await localContext.Database.ExecuteSqlAsync(
                        $"UPDATE tenants SET fetched_until = {until} WHERE id = {tenant.Id}", ct);
        
                    await transaction.CommitAsync(ct);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync(ct);
                    _logger.LogError(ex, "Ingestion failure for tenant {TenantId}", tenant.Id);
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