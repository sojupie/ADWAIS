namespace Infrastructure.Migrations;

public static class SqlDefinitions
{
    public const string CreateMaterializedViews = @"
        -- 1. Financial Tenant Rollup
        CREATE MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup AS
        SELECT date(orders.created_date)       AS created_date,
               orders.tenant_id,
               count(orders.id)                AS volume,
               sum(orders.total_value_inc_vat) AS revenue
        FROM orders
        WHERE orders.created_date >= (CURRENT_DATE - '730 days'::interval)
        GROUP BY 1, 2
        ORDER BY 1 DESC, 2;
        CREATE UNIQUE INDEX uq_v_mat_fin_tenant_rollup ON v_mat_financial_daily_tenant_rollup (created_date, tenant_id);

        -- 2. Financial Global Rollup
        CREATE MATERIALIZED VIEW v_mat_financial_daily_global_rollup AS
        SELECT created_date,
               sum(volume)  AS global_volume,
               sum(revenue) AS global_revenue
        FROM v_mat_financial_daily_tenant_rollup
        GROUP BY 1
        ORDER BY 1 DESC;
        CREATE UNIQUE INDEX uq_v_mat_fin_global_rollup ON v_mat_financial_daily_global_rollup (created_date);

        -- 3. Latency Monitor Rollup
        CREATE MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup AS
        SELECT date(date) AS date,
               monitor_id,
               avg(average) AS average,
               min(lowest)  AS lowest,
               max(highest) AS highest
        FROM response_time
        WHERE response_time.date >= (CURRENT_DATE - '730 days'::interval)
        GROUP BY 1, 2
        ORDER BY 1 DESC, 2;
        CREATE UNIQUE INDEX uq_v_mat_lat_monitor_rollup ON v_mat_daily_latency_monitor_rollup (date, monitor_id);

        -- 4. Latency Tenant Rollup
        CREATE MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup AS
        SELECT date(rt.date) AS date,
               m.tenant_id,
               avg(rt.average) AS average,
               min(rt.lowest)  AS lowest,
               max(rt.highest) AS highest
        FROM response_time rt
                 JOIN monitor m ON rt.monitor_id = m.id
        GROUP BY 1, 2
        ORDER BY 1 DESC, 2;
        CREATE UNIQUE INDEX uq_v_mat_lat_tenant_rollup ON v_mat_daily_latency_tenant_rollup (date, tenant_id);

        -- 5. Latency Global Rollup
        CREATE MATERIALIZED VIEW v_mat_daily_latency_global_rollup AS
        SELECT date,
               avg(average) AS average,
               min(lowest)  AS lowest,
               max(highest) AS highest
        FROM v_mat_daily_latency_tenant_rollup
        GROUP BY 1
        ORDER BY 1 DESC;
        CREATE UNIQUE INDEX uq_v_mat_lat_global_rollup ON v_mat_daily_latency_global_rollup (date);
    ";

    public const string DropMaterializedViews = @"
        DROP MATERIALIZED VIEW IF EXISTS v_mat_financial_daily_global_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_financial_daily_tenant_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_global_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_tenant_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_monitor_rollup CASCADE;
    ";
}
