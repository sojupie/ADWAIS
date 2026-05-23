using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs.MaterializedViews;

public class RefreshLatencyMaterializedViewJob(IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IBackgroundJobClient backgroundJobClient)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();

        // Refresh materialized views in sequential order to respect data dependencies.
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_latency_monitor_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_latency_tenant_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_latency_global_rollup;");
    }
}