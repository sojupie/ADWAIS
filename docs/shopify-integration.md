# Shopify order source

Status: skeleton. Not tested against a live store.

## What exists

- `src/Domain/IntegrationProviders.cs` adds the `shopify` provider key.
- `src/Infrastructure/Services/Orders/ShopifyOrderSource.cs` implements `IOrderSource`.
- `src/Infrastructure/DependencyInjection.cs` registers the typed HTTP client.
- `tests/Adwais.Tests/Services/ShopifyOrderSourceTests.cs` has 14 unit tests.

Registration is automatic. The provider appears in the descriptor endpoint, tenant settings, validators, and secret handling. No frontend or OpenAPI changes are needed.

## Fetching orders

`FetchOrdersAsync` calls `GET {endpointUrl}/admin/api/2026-07/orders.json`.

Query parameters:

- `status=any`
- `created_at_min` and `created_at_max` (ISO 8601 UTC)
- `limit` capped at 250

Auth uses the `X-Shopify-Access-Token` header.

Pagination uses the response `Link` header. The adapter follows `rel=next` links and stops when it has `take` orders.

Settings: `endpointUrl` (store URL) and `accessToken` (custom app Admin API token). Secret masking and clearing mirror `LitiumOrderSource`. The value `configured` is rejected as a token.

## Order values

Values come from `current_total_price` and `current_total_tax`. These are the amounts after returns. `total_price` is the amount before returns.

ADWAIS KPIs use the total without tax. `TotalValueExcludingVat` is `current_total_price - current_total_tax`. This works for stores with tax-included and tax-excluded prices. Duties can skew the figure.

The stored currency is the shop base currency (`currency`), not the customer currency (`presentment_currency`).

## Order state

`financial_status` maps to `OrderState`:

- `pending`, `authorized` to `PendingProcessing`
- `partially_paid`, `partially_refunded` to `Processing`
- `paid` to `Confirmed`
- `paid` plus `fulfilled` to `Completed`
- `refunded`, `voided`, or `cancelled_at` to `Cancelled`
- anything else to `Unknown`

## Known limits

- The REST Admin API is legacy. New public apps must use GraphQL. Custom apps can still use REST.
- The Order resource returns only the last 60 days by default. Older orders need the `read_all_orders` scope.
- The API version `2026-07` retires quarterly. Review the pin.
- No rate-limit pacing. The resilience handler retries, but nothing reads `X-Shopify-Shop-Api-Call-Limit`.
- `taxes_included` and `duties_included` are ignored.
- No Shopify webhook support. `IngestSingleOrderAsync` is Litium only.
- The `OrderState` mapping mixes lifecycle state and cancellation outcome. See the planned refactor.

## Planned refactor

`OrderState` should hold the lifecycle state only. Cancellation is a separate outcome. Litium expresses cancellation as a value update. Shopify has explicit `cancelled_at`, `voided`, and `refunded` signals.

Plan: add an outcome column to `orders`. Shopify sets it from cancellation signals. Litium sets it when the value is zero. Revenue and volume filters switch from `OrderState != Cancelled` to the outcome. This needs a migration, materialized view changes, and frontend type updates.

## Testing

- 14 unit tests pass.
- The full backend suite passes.
- Not tested against a live store. The API shape was verified against Shopify docs in August 2026.

## Next steps

1. Set up a Shopify dev store and custom app. Scopes: `read_orders`, plus `read_all_orders` for backfill.
2. Verify `current_total_price` and `current_total_tax` against a real store.
3. Decide REST or GraphQL.
4. Consider rate-limit pacing.
5. Consider a MedusaJS adapter.
6. Implement the state versus outcome refactor.
