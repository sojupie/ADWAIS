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

The API client assumes the backend API is running locally. You can customize the fetch target inside [`src/apiClient.ts`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/web/src/apiClient.ts).

---

## Local Development

All commands should ideally be run from the repository root:

*   **Start dev server**: `pnpm --filter web dev`
*   **Build production bundle**: `pnpm --filter web build`
*   **Lint codebase**: `pnpm --filter web lint`

If running directly in this directory (not recommended unless testing locally):
```bash
pnpm dev
pnpm build
```
*(Ensure `corepack enable` has been run on your system)*
