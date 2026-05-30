using Adwais.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Jobs.MaterializedViews;

public class RefreshMonitoringMaterializedViewJob(IDbContextFactory<AnalyticsDbContext> dbContextFactory)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();

        // 1. Latency Views
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_latency_monitor_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_latency_tenant_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_latency_global_rollup;");

        // 2. Availability Views
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_availability_monitor_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_availability_tenant_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_daily_availability_global_rollup;");
    }
}


