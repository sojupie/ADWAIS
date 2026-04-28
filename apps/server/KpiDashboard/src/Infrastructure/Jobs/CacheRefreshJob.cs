using Microsoft.EntityFrameworkCore;
using Quartz;
using Infrastructure;

namespace Infrastructure.Jobs;

public class CacheRefreshJob : IJob
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory;

    public CacheRefreshJob(IDbContextFactory<AnalyticsDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var dbContext = await _contextFactory.CreateDbContextAsync();

        // Dependencies mandate sequential execution. Tenant rollup must refresh before Global.
        await dbContext.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_tenant_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_global_rollup;");
    }
}