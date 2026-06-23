# Web Application (Frontend)

The user-facing dashboard displaying daily order rollups, financial stats, site latency monitors, and internal office events.

## Tech Stack

*   **Runtime & Builder**: Node.js, Vite, TypeScript.
*   **UI Framework**: React 19.
*   **Routing**: `@tanstack/react-router` (File-based, type-safe routing).
*   **Data Fetching**: `@tanstack/react-query` (Caching, auto-refreshing).
*   **Styling**: Tailwind CSS v4.
*   **Visualizations**: Recharts.
*   **Schemas**: Zod.

---

## Directory Structure

*   [`/src/routes`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/web/src/routes) - File-based routes (compiled by TanStack Router).
    *   `/settings` - User configuration, tenant settings, and background jobs dashboard.
*   [`/src/components`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/web/src/components) - Reusable components (e.g., Layouts, Charts, Status Cards).
*   [`/src/hooks`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/web/src/hooks) - React hooks for state and queries.
*   [`/src/apiClient.ts`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/web/src/apiClient.ts) - Global fetch wrapper communicating with the .NET backend.

---

## Configuration

`apps/web/.env` is **tracked in git** — it contains only public Azure app registration IDs (non-secret):

```env
VITE_AZURE_CLIENT_ID=<your-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_AZURE_API_SCOPE=api://<your-client-id>/.default
```

These values come from the same Azure App Registration used by the backend. After cloning, the file is already present. If the app registration changes, update these values to match `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` in the backend `src/.env`.

If you need a local override (e.g., a different tenant), create `apps/web/.env.local` — it is gitignored and takes precedence.

---

## API Codegen (Orval)

Frontend API hooks and TypeScript types are **generated** from the backend OpenAPI spec — do not hand-edit them.

### What gets generated

| Output | Contains |
|---|---|
| `packages/types/generated/` | TypeScript interfaces for all backend DTOs |
| `src/api/generated/endpoints.ts` | React Query hooks (`useXxxQuery`, `useXxxMutation`) |

Both are committed. Re-run codegen whenever the backend API changes.

### Pipeline

```
dotnet build (API)  →  docs/openapi/v1.json  →  pnpm codegen  →  generated files
```

1. The .NET build emits an updated `docs/openapi/v1.json` automatically on each build.
2. Run codegen from the repo root:
   ```bash
   pnpm --filter web codegen
   ```

> The backend must have been **built** (not necessarily running) before codegen so the spec reflects the latest controllers and DTOs.

---

## Local Development

All commands should ideally be run from the repository root:

*   **Start dev server**: `pnpm dev:web` (from root) or `pnpm dev` (from this directory)
*   **Regenerate API types**: `pnpm --filter web codegen`
*   **Build production bundle**: `pnpm --filter web build`
*   **Lint codebase**: `pnpm --filter web lint`

If running directly in this directory (not recommended unless testing locally):
```bash
pnpm dev
pnpm build
```
*(Ensure `corepack enable` has been run on your system)*
