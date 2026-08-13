# Shopify Order Source — Implementation Notes

Status: **skeleton, untested against a live store**. This document records where the
implementation stands, what was verified, and what remains before it can be trusted
in production. Return here before enabling `shopify` as a tenant order provider.

## What exists

- `src/Domain/IntegrationProviders.cs` — `IntegrationProviders.Shopify = "shopify"`.
- `src/Infrastructure/Services/Orders/ShopifyOrderSource.cs` — the `IOrderSource`
  adapter:
  - Settings: `endpointUrl` (store URL, e.g. `https://your-store.myshopify.com`) and
    `accessToken` (custom-app Admin API token). Secret masking, clearing, and the
    `"configured"` sentinel guard mirror `LitiumOrderSource`.
  - `FetchOrdersAsync` — `GET {endpointUrl}/admin/api/2026-07/orders.json` with
    `status=any`, `created_at_min` / `created_at_max` (ISO 8601 UTC), `limit` capped
    at 250, authenticated with the `X-Shopify-Access-Token` header.
  - Pagination via the response `Link` header (`rel=next`, quoted or unquoted).
    `page_info` links are followed verbatim (Shopify forbids extra query params on
    them) and fetching stops once `take` orders are collected.
  - `OrderState` mapping (see below).
- `src/Infrastructure/DependencyInjection.cs` — typed `HttpClient` registration.
- `tests/Adwais.Tests/Services/ShopifyOrderSourceTests.cs` — 14 tests using a fake
  `HttpMessageHandler`; no external calls.

Registering the adapter makes it appear automatically in the
`/api/integrations/order-providers` descriptor endpoint, the tenant settings forms,
validators, and secret handling. No frontend or OpenAPI changes are required.

## Testing status

- 14 unit tests pass (`dotnet test`), covering: settings merge/clear/masking,
  unknown-key and `"configured"` rejection, request URL + auth header, response
  parsing, `OrderState` mapping, Link-header pagination, stop-at-`take`, error
  responses, incomplete settings.
- Full backend suite passes (216 tests, unaffected).
- **Not tested against a real store.** No Shopify dev store / custom app exists in
  the dev environment. The wire shape was verified against Shopify's live docs in
  August 2026 (admin-rest 2026-04 reference, versioning page, REST pagination guide)
  but the adapter itself has never made a real request.

## Verified against Shopify docs (Aug 2026)

- Endpoint, `status=any` semantics, `created_at_min/max`, `limit` ≤ 250, `orders`
  array response, string-typed amounts — confirmed.
- `X-Shopify-Access-Token` header — confirmed.
- Link-header cursor pagination — confirmed.
- `financial_status` values (`pending`, `authorized`, `partially_paid`, `paid`,
  `partially_refunded`, `refunded`, `voided`) — all seven match the mapping below.

## Known limits and open questions

- **REST Admin API is legacy.** Shopify declared it legacy in Oct 2024; since
  Apr 2025 new *public* apps must use the GraphQL Admin API exclusively. REST still
  works for **custom apps**, which is the assumed adopter model. If adopters are
  expected to use public apps, a GraphQL-based adapter is required.
- **60-day order window.** The Order resource only returns orders from the last 60
  days by default. Backfilling further back requires the `read_all_orders` scope,
  which the app developer must request and be granted via the Partner Dashboard
  (it cannot be self-served). Current adapter is fine for ongoing ingestion; long
  first-run backfills will silently see nothing older than 60 days.
- **API version pin.** `ApiVersion = "2026-07"` (stable through Jul 2027). Stable
  versions retire quarterly; the pin needs periodic review.
- **No rate-limit handling.** Shopify REST budgets ~2 requests/second per shop.
  The registered resilience handler covers retries, but nothing inspects
  `X-Shopify-Shop-Api-Call-Limit` to pace requests. Fine for 30-day-chunk
  ingestion; not fine for aggressive backfills.
- **Revenue basis is VAT-exclusive.** All ADWAIS revenue/volume KPIs now sum
  `TotalValueExcVat` (order totals without tax), so figures are comparable across
  B2B and B2C tenants regardless of whether prices include or exclude VAT.
  `TotalValueIncVat` is still stored and exposed on `OrderDto` but is no longer
  used by KPI computations. Note: the financial materialized-view SQL
  (`MaterializedViewOrchestrator.cs`) also switched to `total_value_exc_vat`;
  environments with existing views must drop/recreate
  `v_mat_financial_daily_tenant_rollup` (the global rollup derives from it) for
  the change to take effect.
- **VAT semantics are approximate.** `TotalValueIncludingVat` = `current_total_price`,
  `TotalValueExcludingVat` = `current_total_price − current_total_tax`. Shopify
  splits order totals into "before returns" (`total_price`) and "after returns"
  (`current_total_price`) — verified via the GraphQL `Order` reference. The adapter
  reads the `current_*` values so refunds converge on re-ingestion, matching how
  Litium expresses partial cancellation (value update, state unchanged). Shopify's
  `taxes_included` flag and `duties_included` are ignored; for stores where prices
  exclude tax or duties apply, the exc-VAT figure will be wrong — decide whether
  that matters for the revenue KPIs before going live.
- **Currency.** The adapter stores the **shop base currency** (`currency`), falling
  back to `presentment_currency` (customer-facing sale currency), else `"UNK"`.
  The amount (`current_total_price`) is already in shop currency, so amount and
  label are always paired. This mirrors the Litium integration, which picks a
  single converted currency per order. Shopify performs no server-side conversion —
  a multi-currency store records both the shop currency and the per-customer
  presentment currency on every order, and the platform's own conversion happened
  at checkout. ADWAIS's KPIs currently assume all revenue is SEK (the frontend
  hardcodes SEK; `formatCurrency` defaults to it); a shop whose base currency is
  not SEK will produce misleading KPIs.
  - **Planned future work:** ADWAIS-side currency conversion — e.g. convert
    non-SEK orders to a reporting currency at ingestion time (or via a rates
    service at query time) so tenants with non-SEK bases can be onboarded without
    per-store conversion hacks. This is a general multi-provider concern, not
    Shopify-specific.
- **No webhook path.** `IngestSingleOrderAsync` (the Motastic webhook) stays
  Litium-only; a Shopify order webhook would need signature verification
  (`X-Shopify-Hmac-Sha256`) plus per-store secret storage. Not implemented.
- **Order state mapping.** `voided`/`cancelled_at` → Cancelled; paid+fulfilled →
  Completed; paid → Confirmed; `partially_paid`/`partially_refunded` → Processing;
  `authorized`/`pending` → PendingProcessing; `refunded` → Cancelled; else Unknown.
  `fulfillment_status` values `partial` / `not_eligible` are not used. See the
  planned refactor below — this mapping conflates lifecycle state with cancellation
  outcome and is slated to change.

## Next steps when revisiting

1. Create a Shopify dev store + custom app (scopes: `read_orders`, optionally
   `read_all_orders`), configure a demo tenant with `shopify`, run a real fetch.
2. Verify `current_total_price`/`current_total_tax` semantics against the test
   store's tax setup; revisit the VAT approximation if needed.
3. Decide whether REST is acceptable long-term or a GraphQL adapter should be
   written.
4. Consider rate-limit pacing using `X-Shopify-Shop-Api-Call-Limit`.
5. Consider the MedusaJS adapter (same `IOrderSource` interface) while the
   provider abstraction is fresh.
6. Implement the state-vs-outcome refactor below (also touches Litium).

---

## Planned refactor: order state vs outcome

Status: **designed, not implemented.** Return here before finalizing any
`OrderState` normalization for Shopify (or Litium).

### Problem

The current model conflates two independent facts into `OrderState`:

- **Lifecycle state** — where the order sits in its lifecycle as reported by the
  source (e.g. a Litium order that was confirmed, shipped, and later fully
  refunded is still a **Confirmed** order).
- **Outcome** — whether the order was cancelled/refunded and should therefore be
  excluded from revenue and volume statistics.

Forcing `0 ⟺ OrderState.Cancelled` (an earlier attempt) destroys information:
"a cancelled Litium order is still Confirmed". Each provider expresses
cancellation differently:

- **Litium** — no separate cancellation status; partial/full cancellation is a
  *value update* (`TotalValueIncludingVat` drops, state string unchanged). The
  upsert on re-ingestion already converges the stored value.
- **Shopify** — explicit signals: `cancelled_at`, `financial_status = voided |
  refunded`. Additionally the post-refund amount lives in `current_total_price`,
  not `total_price` (before returns).

### Current stat semantics (the thing that forces the design)

Every revenue/volume KPI is binary: `OrderState != Cancelled` counts, nothing
else matters. The filter appears in:

- `FinancialService.cs` — lines 54, 110, 152, 182, 738, 936.
- `MaterializedViewOrchestrator.cs` — `AND orders.order_state != 'Cancelled'`
  (line ~59) in the daily tenant rollup.

Because only `Cancelled` is excluded, any order that slips through as
non-Cancelled counts toward volume (zero-value orders included). The order-list
UI additionally filters `TotalValueIncVat > 0` (`FinancialService.cs:937`).

### Proposed model

- `OrderState` = lifecycle only, verbatim from the source. `Cancelled` remains a
  valid value only when the source explicitly reports it (Litium webhook already
  tolerates a `Cancelled` status string; Shopify's `cancelled_at`/`voided` are
  explicit cancellations). Shopify's `refunded` should *not* become
  `OrderState.Cancelled`.
- New outcome dimension on `Order`: `bool IsCancelled` (or enum `OrderOutcome` —
  decision pending). Fed per provider:
  - Shopify: `cancelled_at` set, or `financial_status` in `voided`/`refunded`.
  - Litium: `TotalValueIncludingVat == 0`.
  - `partially_refunded` → outcome active, value reduced via
    `current_total_price` (converges on re-ingestion, same as Litium).
- Stat filters switch from `OrderState != Cancelled` to outcome-based exclusion
  at all sites listed above, including the materialized-view SQL.

### Implementation scope (when picked up)

1. EF migration: add the outcome column to `orders`; consider the existing index
   `ix_orders_tenant_id_created_date_order_state` (may want the outcome column
   included). Materialized views are created on startup if missing — existing
   views must be dropped/recreated for the SQL change to take effect in
   environments with data.
2. `OrderSourceOrder` gains the outcome (or the adapters set it on the entity via
   the ingestion service); both the fetch upsert path and the webhook path
   (`IngestSingleOrderAsync`) must apply it.
3. Adapters: Shopify `MapState` stops mapping `refunded` → Cancelled; Litium
   `Normalize` unchanged in lifecycle terms.
4. API DTOs (`OrderDto`) and generated frontend types (`pnpm codegen`) expose the
   outcome; check any UI that reads `orderState`.
5. Tests: extend `OrderIngestionServiceTests` (upsert convergence with outcome)
   and `ShopifyOrderSourceTests` (outcome per status), plus the `FinancialService`
   tests if any assert the Cancelled filter.

### Decisions still open

- `bool IsCancelled` vs enum `OrderOutcome` (e.g. `Active | Cancelled | Refunded`)
  — an enum keeps refunded distinct from cancelled if volume/revenue treatment
  ever diverges.
- Whether `OrderState.Cancelled` stays reachable from Shopify's explicit
  cancellations or only via the outcome.
- Whether historical rows need a one-off backfill of the outcome column from
  `order_state = 'Cancelled'`.
