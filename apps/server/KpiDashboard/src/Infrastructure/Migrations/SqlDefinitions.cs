namespace Infrastructure.Migrations;

public static class SqlDefinitions
{
    public const string DropAllViews = @"
        DROP MATERIALIZED VIEW IF EXISTS v_mat_financial_daily_global_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_financial_daily_tenant_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_global_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_tenant_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_monitor_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_availability_global_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_availability_tenant_rollup CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_availability_monitor_rollup CASCADE;
    ";
}
