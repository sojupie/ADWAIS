# OpenAPI Type Generation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual frontend type definitions and schemas with an automated OpenAPI generation pipeline using Orval.

**Architecture:** Export the ASP.NET Core OpenAPI specification during build. Run Orval to consume the specification, generating shared TypeScript models in the shared types package and React Query hooks leveraging the existing API client wrapper.

**Tech Stack:** Orval, ASP.NET Core OpenAPI, TanStack Query v5, Zod, TypeScript.

---

## Architectural Comparison & Tool Selection

We compared `orval` and `openapi-zod-client` across three primary vectors:

| Evaluation Vector | Orval (Selected) | openapi-zod-client |
| :--- | :--- | :--- |
| **1. Migration Path & Friction** | **Low Friction.** Generates clean native TypeScript models. Existing components importing from `@types` (mapped to `packages/types/index.ts`) can continue using identical import paths with minimal refactoring. | **High Friction.** Generates Zod schemas from which TypeScript types must be inferred via `z.infer`. This forces components to depend directly on inferred types, complicating codebase-wide replacements. |
| **2. Schema & Type Cleanliness** | **High.** Generates pure TS interfaces matching C# DTOs. Supports pre-transformed Recharts arrays natively. Optionally generates clean, separate Zod validation schemas if needed. | **Moderate.** Produces nested, monolithic schemas. Inferred types are often verbose and lose clean type names and documentation comments. |
| **3. Monorepo Integration** | **High.** Highly configurable via `orval.config.ts`. Can output types directly to `packages/types/` and React Query hooks to `apps/web/`. Supports TanStack Query v5. | **Low/Moderate.** Primarily geared towards producing a single monolithic zod client, making it difficult to partition types into a separate package. |

**Decision:** Use **Orval** to automate generating types in the shared `packages/types` workspace and TanStack Query v5 hooks in the `apps/web` app.

---

## Proposed Changes

### Component: Backend (OpenAPI Extraction)
Configure the ASP.NET Core API to write the OpenAPI document to a static file on build.

#### [MODIFY] [Adwais.Api.csproj](file:///c:/Users/ollem/Git/motillo%20project/ADWAIS/apps/server/ADWAIS/src/Api/Adwais.Api.csproj)
- Add package reference to `Microsoft.Extensions.ApiDescription.Server` to automate OpenAPI specification export during backend build.

### Component: Shared Types (Type Replacement)
Replace manual types with the generated TS interfaces.

#### [MODIFY] [index.ts](file:///c:/Users/ollem/Git/motillo%20project/ADWAIS/packages/types/index.ts)
- Replace manual interface definitions with imports/re-exports from the generated OpenAPI types file.

### Component: Frontend Web (Client & Generation config)
Configure Orval and integrate generated React Query hooks.

#### [NEW] [orval.config.ts](file:///c:/Users/ollem/Git/motillo%20project/ADWAIS/apps/web/orval.config.ts)
- Configure Orval to read the exported OpenAPI specification, write models to `packages/types/generated`, and write TanStack Query hooks to `apps/web/src/api/generated`.

#### [MODIFY] [package.json](file:///c:/Users/ollem/Git/motillo%20project/ADWAIS/apps/web/package.json)
- Add `orval` package and devDependencies.
- Add code-generation script commands.

---

## Tasks

### Task 1: Configure Backend OpenAPI Export

**Files:**
- Modify: `apps/server/ADWAIS/src/Api/Adwais.Api.csproj`

- [ ] **Step 1: Reference ApiDescription.Server package**
  Add the package reference to `apps/server/ADWAIS/src/Api/Adwais.Api.csproj`:
  ```xml
  <PackageReference Include="Microsoft.Extensions.ApiDescription.Server" Version="10.0.3" PrivateAssets="All" />
  ```
  Also configure properties to define the output directory and filename:
  ```xml
  <PropertyGroup>
    <OpenApiDocumentsDirectory>$(MSBuildProjectDirectory)/../../../../../../docs/openapi</OpenApiDocumentsDirectory>
    <OpenApiDocumentName>v1</OpenApiDocumentName>
  </PropertyGroup>
  ```

- [ ] **Step 2: Run backend build to verify document generation**
  Run: `dotnet build apps/server/ADWAIS/Adwais.sln`
  Expected: Builds with 0 errors and generates the OpenAPI spec file in `docs/openapi/v1.json` (or similar configured path).

- [ ] **Step 3: Commit**
  ```bash
  git add apps/server/ADWAIS/src/Api/Adwais.Api.csproj
  git commit -m "build: configure build-time OpenAPI document generation"
  ```

---

### Task 2: Configure Orval in Monorepo

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/orval.config.ts`

- [ ] **Step 1: Install Orval and its dependencies**
  Run: `pnpm --filter web add -D orval`

- [ ] **Step 2: Create Orval configuration**
  Create `apps/web/orval.config.ts` to read the static OpenAPI JSON and generate:
  1. Types to `packages/types/generated/index.ts`
  2. React Query hooks to `apps/web/src/api/generated/endpoints.ts` utilizing custom API Client.
  
  ```typescript
  import { defineConfig } from 'orval';

  export default defineConfig({
    adwais: {
      input: '../../docs/openapi/v1.json',
      output: {
        mode: 'split',
        target: './src/api/generated/endpoints.ts',
        schemas: '../../packages/types/generated',
        client: 'react-query',
        override: {
          mutator: {
            path: './src/api/apiClient.ts',
            name: 'apiClient',
          },
        },
      },
    },
  });
  ```

- [ ] **Step 3: Run Orval codegen**
  Run: `pnpm --filter web exec orval`
  Expected: Output directories populated with generated types and React Query hooks.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/web/package.json apps/web/orval.config.ts
  git commit -m "feat: install and configure Orval generation pipeline"
  ```

---

### Task 3: Replace Manual Frontend Types with Generated Outputs

**Files:**
- Modify: `packages/types/index.ts`
- Modify: `apps/web/src/schemas.ts`

- [ ] **Step 1: Update packages/types/index.ts to re-export generated types**
  Point the core type exports to the generated models file, ensuring backwards compatibility for existing imports in components.
  ```typescript
  export * from './generated';
  ```

- [ ] **Step 2: Ensure timeframe validation remains safe in schemas.ts**
  Validate that `apps/web/src/schemas.ts` references valid parameters.

- [ ] **Step 3: Commit**
  ```bash
  git add packages/types/index.ts apps/web/src/schemas.ts
  git commit -m "refactor: replace manual type definitions with generated OpenAPI models"
  ```

---

## Verification Plan

### Automated Tests
- Run backend compilation: `dotnet build apps/server/ADWAIS/Adwais.sln`
- Run frontend type check and build: `pnpm --filter web build`

### Manual Verification
- Confirm that generated TanStack Query hooks in `apps/web/src/api/generated/` successfully use the custom `apiClient` and compile cleanly with React 19 and TanStack Query v5.
- Confirm that the existing frontend charts continue to display data correctly from the mock/runtime database.
