using Microsoft.EntityFrameworkCore;
using Quartz;
using Domain.Entities;
using System.Net.Http;
using System.Threading.Tasks;

namespace Infrastructure.Jobs;

[DisallowConcurrentExecution]
public class TenantIngestionJob : IJob
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory;
    private readonly IHttpClientFactory _httpClientFactory;

    public TenantIngestionJob(
        IDbContextFactory<AnalyticsDbContext> contextFactory,
        IHttpClientFactory httpClientFactory)
    {
        _contextFactory = contextFactory;
        _httpClientFactory = httpClientFactory;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var rootContext = await _contextFactory.CreateDbContextAsync(context.CancellationToken);

        var tenants = await rootContext.Tenants
            .Where(t => t.Enabled && !t.CurrentlyFetching)
            .ToListAsync(context.CancellationToken);

        var options = new ParallelOptions()
        {
            MaxDegreeOfParallelism = 10,
            CancellationToken = context.CancellationToken
        };
        
        await Parallel.ForEachAsync(tenants, options, async (tenant, ct) =>
        {
            using var localContext = await _contextFactory.CreateDbContextAsync(ct);

            await localContext.Database.ExecuteSqlAsync(
                $"UPDATE tenants SET currently_fetching = TRUE WHERE id = {tenant.Id}", ct);

            try
            {
                // Logic for ingestion would go here (for example, using "_httpClientFactory" and tenant.ApiUrl)
            }
            finally
            {
                await localContext.Database.ExecuteSqlAsync(
                    $"UPDATE tenants SET currently_fetching = FALSE WHERE id = {tenant.Id}", ct);
            }
        });
    }
}