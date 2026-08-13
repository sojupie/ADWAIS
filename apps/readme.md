# Applications (`/apps`)

This directory houses the primary application codebases for the KPI Dashboard.

## Applications List

### 1. [`/apps/web`](/apps/web)
The frontend web dashboard.
* **Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Router (file-based routing), TanStack Query, Recharts.
* **Purpose**: User interface displaying Daily KPI rollups, financial graphs, UptimeRobot monitoring statistics, and internal office events.

### 2. [`/apps/server`](/apps/server)
The API backend runtime.
* **Stack**: .NET 10 Web API, Entity Framework Core, PostgreSQL, Hangfire.
* **Purpose**: Data ingestion pipelines (syncing order statistics and uptime latency status) and client endpoints serving the web dashboard.
* **Source Location**: [`/apps/server/Adwais`](/apps/server/Adwais)

---

## Workspace Rules

* **Dependency Installation**: Do **not** run npm or pnpm commands inside these app subdirectories. Always use `pnpm` from the root workspace folder to keep the dependency tree clean and prevent local lockfile corruption.
* **Filtering Tasks**: You can run tasks targeting specific apps from the root directory using pnpm filters:
  ```bash
  pnpm --filter web <command>
  ```
