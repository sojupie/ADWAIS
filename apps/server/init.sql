CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_global_rollup CASCADE;
DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_tenant_rollup CASCADE;
DROP MATERIALIZED VIEW IF EXISTS v_mat_daily_latency_monitor_rollup CASCADE;
DROP MATERIALIZED VIEW IF EXISTS v_mat_financial_daily_global_rollup CASCADE;
DROP MATERIALIZED VIEW IF EXISTS v_mat_financial_daily_tenant_rollup CASCADE;

DROP TABLE IF EXISTS response_time CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS monitor CASCADE;
DROP TABLE IF EXISTS tenant CASCADE;
DROP TABLE IF EXISTS global_config CASCADE;

CREATE TABLE global_config (
                               last_polled timestamptz,
                               enabled boolean NOT NULL,
                               litium_rate_limit integer NOT NULL,
                               uptimerobot_rate_limit integer NOT NULL,
                               latency_degraded_floor integer,
                               monitors_count integer NOT NULL DEFAULT 0,
                               monitors_limit integer NOT NULL,
                               active_subscription varchar(255)
);

CREATE TABLE tenant (
                        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                        name varchar(255) NOT NULL,
                        litium_base_url varchar(255) NOT NULL,
                        service_account_token varchar(255) NOT NULL,
                        order_count integer NOT NULL,
                        currently_fetching boolean NOT NULL,
                        fetched_from timestamptz,
                        fetched_until timestamptz,
                        last_polled timestamptz,
                        ping_reachable boolean,
                        order_fetching_enabled boolean NOT NULL
);

CREATE TABLE monitor (
                         id integer PRIMARY KEY,
                         tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
                         name varchar(255) NOT NULL,
                         url varchar(255) NOT NULL,
                         uptime_sla numeric,
                         uptime_monitor_enabled boolean NOT NULL,
                         creation_date timestamptz
);

CREATE TABLE orders (
                        id uuid PRIMARY KEY,
                        tenant_id uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
                        order_state text,
                        order_type text,
                        litium_order_id text NOT NULL,
                        created_date timestamptz NOT NULL,
                        total_value_inc_vat integer NOT NULL,
                        total_value_exc_vat integer NOT NULL,
                        currency varchar(3) NOT NULL,
                        last_update timestamptz
);

CREATE INDEX idx_orders_composite_dash ON orders (created_date, tenant_id) INCLUDE (total_value_inc_vat);
CREATE INDEX idx_orders_value_dist ON orders (tenant_id, total_value_inc_vat);
CREATE INDEX idx_orders_tenant_isolated ON orders (tenant_id, created_date) INCLUDE (total_value_inc_vat);
ALTER TABLE orders ADD CONSTRAINT uq_orders_tenant_litium_id UNIQUE (tenant_id, litium_order_id);

CREATE TABLE users (
                       id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                       name varchar(255) NOT NULL,
                       role varchar(50)
);

CREATE TABLE response_time (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               monitor_id integer NOT NULL REFERENCES monitor(id) ON DELETE CASCADE,
                               date timestamptz NOT NULL,
                               average double precision,
                               lowest double precision,
                               highest double precision
);

CREATE MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup AS
SELECT date(orders.created_date)       AS created_date,
       orders.tenant_id,
       count(orders.id)                AS volume,
       sum(orders.total_value_inc_vat) AS revenue
FROM orders
WHERE orders.created_date >= (CURRENT_DATE - '730 days'::interval)
GROUP BY date(orders.created_date), orders.tenant_id;

CREATE MATERIALIZED VIEW v_mat_financial_daily_global_rollup AS
SELECT created_date,
       sum(volume)  AS global_volume,
       sum(revenue) AS global_revenue
FROM v_mat_financial_daily_tenant_rollup
GROUP BY created_date;

CREATE MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup AS
SELECT date(date) AS date,
       monitor_id,
       avg(average) AS average,
       min(lowest)  AS lowest,
       max(highest) AS highest
FROM response_time
GROUP BY date(date), monitor_id;

CREATE MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup AS
SELECT date(rt.date) AS date,
       m.tenant_id,
       avg(rt.average) AS average,
       min(rt.lowest)  AS lowest,
       max(rt.highest) AS highest
FROM response_time rt
         JOIN monitor m ON rt.monitor_id = m.id
GROUP BY date(rt.date), m.tenant_id;

CREATE MATERIALIZED VIEW v_mat_daily_latency_global_rollup AS
SELECT date(date) AS date,
       avg(average) AS average,
       min(lowest)  AS lowest,
       max(highest) AS highest
FROM response_time
GROUP BY date(date);