# KpiDashboard

KpiDashboard is a .NET 10 based analytics and monitoring server that aggregates data from various sources (Litium, UptimeRobot, and internal office events) to provide high-level KPIs and monitoring insights.

## Project Overview

*   **Architecture:** Clean Architecture with distinct layers:
    *   **Api:** ASP.NET Core Web API with Controllers, DTOs, and Validators.
    *   **Domain:** Core business logic, Entities (OrderData, Monitoring, Office), and Enums.
    *   **Infrastructure:** Entity Framework Core (PostgreSQL) implementation, Hangfire for background jobs, and External Service integrations (UptimeRobot, Litium).
*   **Key Technologies:**
    *   **Runtime:** .NET 10
    *   **Database:** PostgreSQL with EF Core (Snake Case naming convention).
    *   **Background Jobs:** Hangfire (PostgreSQL storage).
    *   **Validation:** FluentValidation.
    *   **API Documentation:** Swagger/OpenAPI.
    *   **Resilience:** Polly for HTTP retries and exponential backoff.
    *   **Environment:** DotNetEnv for `.env` file support.

## Core Domains

1.  **Financial/Order Data:** Aggregates order data (likely from Litium) into daily rollups at both tenant and global levels.
2.  **Monitoring:** Integrates with UptimeRobot to track site uptime and latency. Includes automated synchronization and dispatcher jobs.
3.  **Office (Intranät):** Tracks internal events, guest visits, and office messages.

## Building and Running

### Prerequisites
*   .NET 10 SDK
*   PostgreSQL database
*   UptimeRobot API Key (configured in `global_config` or `.env`)

### Configuration
*   Uses `appsettings.json` and `.env` files.
*   The connection string `AnalyticsDb` is required for PostgreSQL.

### Key Commands
*   **Restore:** `dotnet restore`
*   **Build:** `dotnet build`
*   **Run API:** `dotnet run --project src/Api/Api.csproj`
*   **Database Migrations:**
    *   Add Migration: `dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Api`
    *   Update Database: `dotnet ef database update --project src/Infrastructure --startup-project src/Api`

## Development Conventions

*   **Database Naming:** Use `SnakeCaseNamingConvention()` in EF Core.
*   **Controllers:** Follow standard RESTful patterns. Background tasks should be offloaded to Hangfire.
*   **Validation:** All DTOs should have corresponding `FluentValidation` validators.
*   **Async/Await:** Use asynchronous programming throughout the stack.
*   **Rollups:** Financial and Latency data are aggregated into "Rollups" (materialized views or tables) for performance.
*   **Tenants:** The system supports multi-tenancy, with a special `SystemTenantGuid` (`00000000-0000-0000-0000-000000000001`) for unassigned resources.
