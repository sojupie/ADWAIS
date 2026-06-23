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
    *   Implementations of cache services, Hangfire jobs, and external API clients (UptimeRobot, Litium).

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
*   **HTTP Clients & Resilience**: `Polly` for automated API retries and backoff strategies.
*   **Configuration**: `DotNetEnv` for runtime mapping of `.env` configurations.

---

## Local Setup

### Prerequisites
*   .NET 10 SDK
*   PostgreSQL running locally (default: `localhost:5432`, database `analyticsdb`, user `postgres`, password `development_password`)

### Configuration files

Two config files are needed. One is tracked in git; one must be created from the example.

#### `src/Api/appsettings.Development.json` — tracked in git

Already present after cloning. Contains non-secret dev defaults:

```json
{
  "ConnectionStrings": {
    "AnalyticsDb": "Host=localhost;Database=analyticsdb;Username=postgres;Password=development_password"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Domain": "localhost",
    "TenantId": "common",
    "ClientId": "00000000-0000-0000-0000-000000000000"
  },
  "FeatureToggles": {
    "EnableRuntimeDataSeeding": true,
    "MockUptimeRobotIntegrations": true
  }
}
```

`EnableRuntimeDataSeeding` — registers `RuntimeDataSeederJob` in Hangfire (every minute, seeds mock order + latency data).  
`MockUptimeRobotIntegrations` — makes mock monitors (negative IDs) show `"Up"` status without a real UptimeRobot API key.

#### `src/.env` — gitignored, must be created

Copy from the example and fill in real values:

```bash
cp src/.env.example src/.env
```

| Variable | Where to find it |
|---|---|
| `AZURE_TENANT_ID` | Azure Portal → Azure Active Directory → Overview |
| `AZURE_CLIENT_ID` | Azure Portal → App Registrations → your app → Application (client) ID |
| `APP_ID_URI` | Azure Portal → App Registrations → your app → Expose an API |

> For local dev with mock data, `AzureAd` values are the only ones strictly required for auth.


---

## Development Commands

Run from `apps/server/ADWAIS`:

*   **Build**:
    ```bash
    dotnet build
    ```
*   **Run**:
    ```bash
    dotnet run --project src/Api/Adwais.Api.csproj
    ```
*   **Add migration**:
    ```bash
    dotnet ef migrations add <MigrationName> --project src/Infrastructure/Adwais.Infrastructure.csproj --startup-project src/Api/Adwais.Api.csproj
    ```
*   **Apply migrations**:
    ```bash
    dotnet ef database update --project src/Infrastructure/Adwais.Infrastructure.csproj --startup-project src/Api/Adwais.Api.csproj
    ```
