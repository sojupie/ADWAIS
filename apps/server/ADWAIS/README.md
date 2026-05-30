# ADWAIS Backend Service

The analytics and monitoring server that aggregates data from external resources (such as UptimeRobot) and processes daily KPIs.

## System Overview

*   **Architecture**: Clean Architecture structure with loose coupling and clear separation of concerns.
*   **Target Runtime**: .NET 10.0
*   **Database Integration**: PostgreSQL (via Entity Framework Core with Snake Case naming convention).
    *   *Convention*: Database schema configurations, attributes, and model mappings are managed **strictly** using Fluent API inside [`AnalyticsDbContext.cs`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/server/Adwais/src/Infrastructure/AnalyticsDbContext.cs). Do **not** use EF Core data annotations on the domain entity models.
*   **Background Ingestion Processing**: Hangfire (configured with PostgreSQL storage) executes scheduled syncing jobs.

---

## Clean Architecture Layers

1.  **Api (Presentation Layer)**:
    *   ASP.NET Core Controllers serving RESTful endpoints.
    *   DTO schemas defining request/response structures.
    *   `FluentValidation` validators protecting endpoint inputs.
2.  **Domain (Core Enterprise Logic)**:
    *   Pure business entities (e.g. Orders, Latency data, Tenants).
    *   Domain enums and system-level configuration parameters.
3.  **Infrastructure (Implementation Layer)**:
    *   EF Core DbContext and database migration history.
    *   External clients (e.g. UptimeRobot REST client).
    *   Hangfire task scheduler and background sync dispatchers.

---

## Technical Stack & Libraries

*   **Database Mapper**: Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`).
*   **Job Scheduler**: `Hangfire.AspNetCore` + `Hangfire.PostgreSql`.
*   **API Verification**: `FluentValidation.DependencyInjectionExtensions`.
*   **HTTP Clients & Resilience**: `Polly` for automated API retries and backoff strategies.
*   **Configuration**: `DotNetEnv` for runtime mapping of `.env` configurations.

---

## Local Setup

### 1. Prerequisites
*   .NET 10.0 SDK
*   A running PostgreSQL instance

### 2. Configuration
The API relies on environmental configurations. Populate your `.env` or `appsettings.json` file in the API project with:
*   `AnalyticsDb`: The connection string for PostgreSQL.

---

## Development Commands

Run these commands from the `apps/server/Adwais` directory:

*   **Build the API**:
    ```bash
    dotnet build
    ```
*   **Run the Web API**:
    ```bash
    dotnet run --project src/Api/Adwais.Api.csproj
    ```
*   **Add database migration**:
    ```bash
    dotnet ef migrations add <MigrationName> --project src/Infrastructure/Adwais.Infrastructure.csproj --startup-project src/Api/Adwais.Api.csproj
    ```
*   **Apply migrations to database**:
    ```bash
    dotnet ef database update --project src/Infrastructure/Adwais.Infrastructure.csproj --startup-project src/Api/Adwais.Api.csproj
    ```
