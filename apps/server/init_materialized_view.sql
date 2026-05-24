CREATE MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup AS
SELECT date_trunc('day', orders.created_date) AS created_date,
       orders.tenant_id,
       count(orders.id)                AS volume,
       sum(orders.total_value_inc_vat) AS revenue
FROM orders
WHERE orders.created_date >= (CURRENT_DATE - '730 days'::interval)
GROUP BY 1, 2;

CREATE MATERIALIZED VIEW v_mat_financial_daily_global_rollup AS
SELECT created_date,
       sum(volume)  AS global_volume,
       sum(revenue) AS global_revenue
FROM v_mat_financial_daily_tenant_rollup
GROUP BY created_date;

CREATE MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup AS
SELECT date_trunc('day', date) AS date,
       monitor_id,
       avg(average) AS average,
       min(lowest)  AS lowest,
       max(highest) AS highest
FROM response_time
GROUP BY 1, 2;

CREATE MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup AS
SELECT date_trunc('day', rt.date) AS date,
       m.tenant_id,
       avg(rt.average) AS average,
       min(rt.lowest)  AS lowest,
       max(rt.highest) AS highest
FROM response_time rt
         JOIN monitor m ON rt.monitor_id = m.id
GROUP BY 1, 2;

CREATE MATERIALIZED VIEW v_mat_daily_latency_global_rollup AS
SELECT date_trunc('day', date) AS date,
       avg(average) AS average,
       min(lowest)  AS lowest,
       max(highest) AS highest
FROM response_time
GROUP BY 1;