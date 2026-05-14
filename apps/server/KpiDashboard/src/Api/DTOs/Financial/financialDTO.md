Dashboard Architecture & View Context

This document defines the core architecture, database routing, and data-merging logic for the Motillo Financial Dashboard APIs. It establishes the distinction between "Global (Portfolio) View" and "Drill-down View" requests, and dictates how fresh data is handled.
1. Architectural Paradigm & Constraints

The dashboard operates on a strict parent-child aggregation model.

    Dumb Client UI: The frontend does not perform mathematical aggregations, data binning, or raw database querying.

    Backend Packaging: The backend is entirely responsible for querying the database, performing all necessary calculations (including the "Today" data merge), and returning fully packaged DTOs formatted exactly as the UI charts require.

    Currency Standard: Currency is universally assumed to be SEK. No currency normalization logic is required.

    No Exclusion Logic: All active tenants are included in global calculations. There is no logic to exclude specific entities from the portfolio baseline.

The distinction between the two views is dictated solely by the presence of a tenantId query parameter in the API request.
2. The "Historical + Fresh" Data Merge Strategy (Crucial)

The backend manages data ingestion via Hangfire jobs:

    Fresh Data: A polling job fetches e-commerce orders every 10 minutes, inserting them into the raw orders table.

    Historical Data: A daily job refreshes the materialized views (v_mat_financial_daily_global_rollup and v_mat_financial_daily_tenant_rollup). These views only contain data up to 23:59:59 of yesterday.

This is a separate ticket MK-61: BE: Hangfire job för fetching av Litium dataTo Do
.

This end-point only needs to prepare data already in the database and gracefully handle cases where there is no data. It does not need to go try and fetch new data from Litium.

Backend Implementation Requirement: To serve accurate, real-time metrics, the backend cannot rely solely on the materialized views. For any timeframe that includes the current day, the backend MUST perform a union/merge:

    Step A: Query the requested historical timeframe (Start Date to Yesterday) from the appropriate materialized view.

    Step B: Query the fresh data for "Today" (00:00:00 to Now) directly from the raw orders table.

    Step C: Aggregate the fresh "Today" rows in memory (or via SQL UNION) to match the schema of the materialized view.

    Step D: Combine A and C to form the complete dataset before calculating final KPIs (growth, totals) and packaging the DTOs.

3. Global (Portfolio) View

Trigger: The tenantId parameter is null or omitted from the request.

Definition: Represents the aggregate total of all active consulting clients (Tenants) managed by Motillo.

Backend Implementation Guidelines:

    Aggregate Metrics (Top-line): Combine historical data from v_mat_financial_daily_global_rollup with today's global aggregate from the raw orders table.

    Comparative Metrics (e.g., Growth Extremes, Momentum Matrix): Combine historical data from v_mat_financial_daily_tenant_rollup with today's tenant-grouped aggregates from the raw orders table. Join with tenant.Name for UI labels.

4. Drill-down (Isolated) View

Trigger: The tenantId parameter contains a specific UUID matching a record in the tenant table.

Definition: Represents a single, isolated client (Tenant).

Backend Implementation Guidelines:

    Scoped Metrics: The API must strictly scope all queries to the provided tenantId.

    Primary Data Source (Time-series & KPIs): Combine historical data from v_mat_financial_daily_tenant_rollup (filtered by tenantId) with today's aggregate from the raw orders table (filtered by tenantId).

    Granular Data Packaging (Order Value Distribution): For metrics requiring histogram binning of individual order values, the API must bypass the materialized views entirely and query the raw orders table (leveraging idx_orders_value_dist).

        The backend calculates the bin ranges (min/max), counts the orders falling into those bins, and returns the packaged array.


API DTO Specification: Motillo Executive Dashboard
1. Global Request Parameters

All endpoints require the following context parameters to filter the underlying data set.

    timeframe: Enum (T7, T30, T90, YTD). Defines the primary current period. The previous period is calculated as the immediately preceding block of identical duration.

    timezone: String (e.g., UTC). Enforces boundary alignment for CreatedDate isolation.

    excludeTenantIds: Array of Strings. Defines entities to mathematically strip from all portfolio-level aggregations.

    tenantId: String (Optional). If provided, scopes the request to the specified entity (Drilldown View). If null, scopes to the global portfolio.

2. Global KPIs (Portfolio & Drilldown View)

Aggregated top-line metrics.

DTO Structure:

    currentRevenue: Decimal. Sum of TotalValue for all orders in the current period.

    previousRevenue: Decimal. Sum of TotalValue for all orders in the previous period.

    revenueGrowthPercentage: Decimal. Calculated as (currentRevenue - previousRevenue) / previousRevenue.

    transactionVolume: Integer. Count of total orders (CreatedDate events) in the current period.

    averageOrderValue: Decimal. Calculated as currentRevenue / transactionVolume.

Hover/State Requirements:

The UI compares current vs. previous revenue to determine the directional arrow (▲/▼) and color logic for the revenueGrowthPercentage.
3. Revenue Velocity Over Time (Portfolio & Drilldown View)

Time-series data comparing current period performance against the previous period.

DTO Structure (Array of Objects):

    periodLabel: String. Human-readable axis label (e.g., "Day 1", "2023-11-01").

    currentRevenue: Decimal. Aggregated revenue for this specific chronological interval in the current period.

    previousRevenue: Decimal. Aggregated revenue for the corresponding chronological interval in the previous period.

    absoluteVariance: Decimal. Calculated as currentRevenue - previousRevenue.

Hover/State Requirements:

The tooltip explicitly requires periodLabel, currentRevenue, previousRevenue, and absoluteVariance.
4. Growth Extremes (Portfolio View)

Diverging bar chart isolating relative and absolute variance per tenant.

DTO Structure (Array of Objects, ordered descending by growthPercentage):

    tenantId: String. Required for click-to-drilldown routing.

    tenantName: String. Y-axis label.

    currentRevenue: Decimal.

    previousRevenue: Decimal.

    growthPercentage: Decimal. Calculated as (currentRevenue - previousRevenue) / previousRevenue. Drives bar length and X-axis mapping.

    absoluteVariance: Decimal. Calculated as currentRevenue - previousRevenue.

Hover/State Requirements:

The tooltip explicitly requires tenantName, growthPercentage, and absoluteVariance. The UI color-codes bars based on the sign (+/-) of growthPercentage.
5. Portfolio Revenue Distribution (Portfolio View)

Pareto chart illustrating dependency and structural risk. Data must be capped to Top N tenants, with the remainder aggregated.

DTO Structure (Array of Objects, ordered descending by absoluteRevenue):

    tenantId: String | Null. Null applies only to the aggregated "Other" bucket. Required for click-to-drilldown routing.

    tenantName: String. X-axis label (e.g., "Tenant A", "Other (5)").

    absoluteRevenue: Decimal. Left Y-axis mapping (Bar height).

    cumulativePortfolioShare: Decimal (0.0 to 1.0). Right Y-axis mapping (Line point). Calculated as the running total of absoluteRevenue divided by the global portfolio currentRevenue. The final node must precisely equal 1.0.

Hover/State Requirements:

The tooltip explicitly requires tenantName, absoluteRevenue, and cumulativePortfolioShare.
6. Momentum Matrix (Portfolio View)

Scatter plot visualizing growth, baseline size, and current volume.

DTO Structure (Object containing Metadata and Array of Tenant Objects):

Metadata:

    medianBaselineRevenue: Decimal. Required to plot the vertical reference line indicating the portfolio median for the previous period.

Tenant Objects:

    tenantId: String. Required for click-to-drilldown routing.

    tenantName: String. Inline data label.

    baselineRevenue: Decimal. X-axis mapping (previousRevenue).

    growthPercentage: Decimal. Y-axis mapping ((currentRevenue - previousRevenue) / previousRevenue).

    currentVolume: Decimal. Z-axis mapping (currentRevenue). Dictates bubble radius.

Hover/State Requirements:

The tooltip explicitly requires tenantName, currentVolume (labeled as T30 Revenue), baselineRevenue (labeled as P30 Baseline), and growthPercentage.
7. Cumulative Growth Delta (Drilldown View)

Step-line chart showing the net addition or subtraction of growth over the current period.

DTO Structure (Array of Objects):

    periodLabel: String. X-axis label.

    cumulativeGrowth: Decimal. Running tally of daily variance. Calculated recursively: Day N cumulativeGrowth = (Day N currentRevenue - Day N previousRevenue) + Day N-1 cumulativeGrowth.

Hover/State Requirements:

The tooltip explicitly requires periodLabel and cumulativeGrowth.
8. Order Value Distribution (Drilldown View)

Histogram data determining the mode(s) of transaction values. The API is responsible for calculating bin widths mathematically based on the tenant's data distribution to avoid UI logic overload.

DTO Structure (Array of Objects, ordered ascending by binMin):

    binLabel: String. X-axis label (e.g., "$10-$20").

    binMin: Decimal. Mathematical floor of the bin.

    binMax: Decimal. Mathematical ceiling of the bin.

    orderCount: Integer. Y-axis mapping. Count of CreatedDate events where TotalValue falls between binMin and binMax.

Hover/State Requirements:

The tooltip explicitly requires binLabel and orderCount.