# ADWAIS Backend Service

The analytics and monitoring server that aggregates data from external resources (such as UptimeRobot) and processes daily KPIs.

## System Overview

*   **Architecture**: Clean Architecture structure with loose coupling and clear separation of concerns.
*   **Target Runtime**: .NET 10.0
*   **Database Integration**: PostgreSQL (via Entity Framework Core with Snake Case naming convention).
    *   *Convention*: Database schema configurations, attributes, and model mappings are managed **strictly** using Fluent API inside `AnalyticsDbContext.cs`. Do **not** use EF Core data annotations on the domain entity models.
*   **Background Ingestion Processing**: Hangfire (configured with PostgreSQL storage) executes scheduled syncing jobs.

---

## Clean Architecture Layers

1.  **Api (Presentation Layer)**:
    *   ASP.NET Core Controllers serving RESTful endpoints.
    *   References the `Application` layer and does not directly compile against `Infrastructure` for service execution.
2.  **Application (Application & Use-Case Layer)**:
    *   Application services coordinating business logic and database access via `IApplicationDbContext`.
    *   DTO models defining requests and responses.
    *   `FluentValidation` validators protecting endpoint inputs.
    *   Interfaces decoupling external services and caching dependencies.
3.  **Domain (Core Enterprise Logic)**:
    *   Pure business entities (e.g., Orders, Latency data, Tenants).
    *   Domain enums under the `Domain/Enums` folder.
    *   No external dependencies or direct dependency on outer layers.
4.  **Infrastructure (Implementation Layer)**:
    *   EF Core `AnalyticsDbContext` implementing `IApplicationDbContext` and migrations.
    *   Implementations of cache services, Hangfire jobs, and external API clients (UptimeRobot, Litium, Shopify).

---

## Domain Design Patterns

*   **Parse, Don't Check**: Strong typing is enforced at API boundaries and ingestion points rather than performing downstream validation on raw primitives:
    *   **TenantId**: The `TenantId` record struct wraps a `Guid` and replaces raw `Guid` parameters. Custom model binding and JSON converters are registered to transparently serialize/deserialize it.
    *   **ResolvedPeriod**: Timeframe requests are parsed into a validated `ResolvedPeriod` at the controller boundary before being passed to business services.
    *   **OrderState**: External order state strings are parsed into an `OrderState` enum at ingestion, avoiding raw string comparisons.

---

## Technical Stack & Libraries

*   **Database Mapper**: Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`).
*   **Job Scheduler**: `Hangfire.AspNetCore` + `Hangfire.PostgreSql`.
*   **API Verification**: `FluentValidation.DependencyInjectionExtensions`.
*   **HTTP Clients & Resilience**: `Microsoft.Extensions.Http.Resilience` (Polly-based) for automated API retries and backoff strategies.
*   **Configuration**: `DotNetEnv` for runtime mapping of `.env` configurations.

---

## Local Setup

### Prerequisites
*   .NET 10 SDK
*   PostgreSQL running locally (default: `localhost:5432`, database `analyticsdb`, user `postgres`, password `development_password`)

### Configuration files

The tracked development settings are enough for normal local API development.
An ignored `.env` file is optional and only needed for local overrides.

#### `src/Api/appsettings.Development.json` — tracked in git

Already present after cloning. Contains non-secret dev defaults:

```json
{
  "ConnectionStrings": {
    "AnalyticsDb": "Host=localhost;Database=analyticsdb;Username=postgres;Password=development_password"
  },
  "Authentication": {
    "OidcAuthority": "https://your-idp.example.com",
    "OidcAudience": "adwais-api",
    "EnableDemoAccess": true
  },
  "FeatureToggles": {
    "EnableRuntimeDataSeeding": true
  }
}
```

`EnableRuntimeDataSeeding` — creates the demo portfolio at startup and registers `RuntimeDataSeederJob` in Hangfire. Every minute it adds demo orders, latency, and availability. Demo monitors use negative local IDs and are always isolated from UptimeRobot.

The production Compose file defaults this toggle to `true` for the hosted interactive demo. Set `ENABLE_RUNTIME_DATA_SEEDING=false` when deploying a live-data installation.

Set `RESEED=true` for one startup to replace existing demo orders and negative-ID monitors. Live orders, positive-ID UptimeRobot monitors, and user-created tenants are preserved.

#### `src/.env` — gitignored, optional overrides

Create this file only when you need to override the tracked development settings:

```bash
cp src/.env.example src/.env
```

| Variable | Where to find it |
|---|---|
| `Authentication__OidcAuthority` | Your provider's OIDC authority URL |
| `Authentication__OidcAudience` | The API audience expected in access tokens |
| `Authentication__EnableDemoAccess` | Set `true` to expose the read-only demo token endpoint |

> Development uses the Admin mock token. Production configuration is supplied by
> Docker Compose from `/opt/adwais/.env`; it requires OIDC settings unless demo
> mode is enabled. The frontend has its own Vite configuration in
> `apps/web/.env.local`.


---

## Development Commands

All commands run from the **repository root** via pnpm shortcuts:

| Command | What it does |
|---|---|
| `pnpm dev:api` | Start the backend API |
| `pnpm dev:api:watch` | Start the backend API with hot-reload (`dotnet watch`) |
| `pnpm migration:add <Name>` | Create a new EF Core migration |
| `pnpm migration:update` | Apply pending migrations to the local database |
| `pnpm migration:remove` | Remove the last unapplied migration |
| `pnpm migration:list` | List all migrations and their applied status |

> **Note**: `migration:add` builds the startup project to inspect the model. Stop `dev:api` first if it is already running, otherwise the build will fail on a port conflict.

### After changing the API

Any time you add, remove, or rename a controller endpoint or DTO, regenerate the frontend types:

```bash
pnpm --filter web codegen
```

This reads `docs/openapi/v1.json` (updated on each `dotnet build`) and regenerates the React Query hooks and TypeScript interfaces in `packages/types/generated/` and `apps/web/src/api/generated/`. See [`apps/web/README.md`](../../../web/README.md) for details.

For the authentication route contract, role policies, demo mode, kiosk JWT flow, and Hangfire session bridge, see [`docs/authentication.md`](../../../docs/authentication.md).

If you need to run raw `dotnet` commands directly (e.g. from `apps/server/ADWAIS`):

```bash
dotnet build
dotnet run --project src/Api/Adwais.Api.csproj
```
