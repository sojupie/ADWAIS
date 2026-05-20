using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs;

public class RefreshFinancialMaterializedViewJob(IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IBackgroundJobClient backgroundJobClient)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();

        // Refresh materialized views in sequential order to respect data dependencies.
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_financial_daily_tenant_rollup;");
        await dbContext.Database.ExecuteSqlRawAsync(
            "REFRESH MATERIALIZED VIEW CONCURRENTLY v_mat_financial_daily_global_rollup;");
    }
}