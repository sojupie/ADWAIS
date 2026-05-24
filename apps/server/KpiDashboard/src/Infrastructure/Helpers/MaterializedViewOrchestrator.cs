using Infrastructure.Migrations;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Helpers;

public static class MaterializedViewOrchestrator
{
    public static async Task SyncViewsAsync(AnalyticsDbContext context)
    {
        // 1. Drop all views to ensure we are applying the latest definitions
        await context.Database.ExecuteSqlRawAsync(SqlDefinitions.DropAllViews);

        // 2. Create Views in dependency order
        
        // --- Financial Domain ---
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup AS
            SELECT date_trunc('day', orders.created_date) AS created_date,
                   orders.tenant_id,
                   count(orders.id)                AS volume,
                   sum(orders.total_value_inc_vat) AS revenue
            FROM orders
            WHERE orders.created_date >= (CURRENT_DATE - '730 days'::interval)
              AND orders.created_date < CURRENT_DATE
            GROUP BY 1, 2
            ORDER BY 1 DESC, 2;
            CREATE UNIQUE INDEX uq_v_mat_fin_tenant_rollup ON v_mat_financial_daily_tenant_rollup (created_date, tenant_id);
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_financial_daily_global_rollup AS
            SELECT created_date,
                   sum(volume)  AS global_volume,
                   sum(revenue) AS global_revenue
            FROM v_mat_financial_daily_tenant_rollup
            WHERE created_date < CURRENT_DATE
            GROUP BY 1
            ORDER BY 1 DESC;
            CREATE UNIQUE INDEX uq_v_mat_fin_global_rollup ON v_mat_financial_daily_global_rollup (created_date);
        ");

        // --- Latency Domain ---
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup AS
            SELECT date_trunc('day', date) AS date,
                   monitor_id,
                   avg(average) AS average,
                   min(lowest)  AS lowest,
                   max(highest) AS highest
            FROM response_time
            WHERE response_time.date >= (CURRENT_DATE - '730 days'::interval)
              AND response_time.date < CURRENT_DATE
            GROUP BY 1, 2
            ORDER BY 1 DESC, 2;
            CREATE UNIQUE INDEX uq_v_mat_lat_monitor_rollup ON v_mat_daily_latency_monitor_rollup (date, monitor_id);
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup AS
            SELECT date_trunc('day', rt.date) AS date,
                   m.tenant_id,
                   avg(rt.average) AS average,
                   min(rt.lowest)  AS lowest,
                   max(rt.highest) AS highest
            FROM response_time rt
                     JOIN monitor m ON rt.monitor_id = m.id
            WHERE rt.date < CURRENT_DATE
            GROUP BY 1, 2
            ORDER BY 1 DESC, 2;
            CREATE UNIQUE INDEX uq_v_mat_lat_tenant_rollup ON v_mat_daily_latency_tenant_rollup (date, tenant_id);
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_daily_latency_global_rollup AS
            SELECT date,
                   avg(average) AS average,
                   min(lowest)  AS lowest,
                   max(highest) AS highest
            FROM v_mat_daily_latency_tenant_rollup
            WHERE date < CURRENT_DATE
            GROUP BY 1
            ORDER BY 1 DESC;
            CREATE UNIQUE INDEX uq_v_mat_lat_global_rollup ON v_mat_daily_latency_global_rollup (date);
        ");

        // --- Availability Domain ---
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_daily_availability_monitor_rollup AS
            SELECT date_trunc('day', date) AS date,
                   monitor_id,
                   avg(uptime_percentage) AS uptime_percentage
            FROM monitor_availability
            WHERE monitor_availability.date >= (CURRENT_DATE - '730 days'::interval)
              AND monitor_availability.date < CURRENT_DATE
            GROUP BY 1, 2
            ORDER BY 1 DESC, 2;
            CREATE UNIQUE INDEX uq_v_mat_avail_monitor_rollup ON v_mat_daily_availability_monitor_rollup (date, monitor_id);
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_daily_availability_tenant_rollup AS
            SELECT date_trunc('day', ma.date) AS date,
                   m.tenant_id,
                   avg(ma.uptime_percentage) AS uptime_percentage
            FROM monitor_availability ma
                     JOIN monitor m ON ma.monitor_id = m.id
            WHERE ma.date < CURRENT_DATE
            GROUP BY 1, 2
            ORDER BY 1 DESC, 2;
            CREATE UNIQUE INDEX uq_v_mat_avail_tenant_rollup ON v_mat_daily_availability_tenant_rollup (date, tenant_id);
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE MATERIALIZED VIEW v_mat_daily_availability_global_rollup AS
            SELECT date,
                   avg(uptime_percentage) AS uptime_percentage
            FROM v_mat_daily_availability_tenant_rollup
            WHERE date < CURRENT_DATE
            GROUP BY 1
            ORDER BY 1 DESC;
            CREATE UNIQUE INDEX uq_v_mat_avail_global_rollup ON v_mat_daily_availability_global_rollup (date);
        ");
    }
}
