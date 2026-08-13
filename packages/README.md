# Shared Packages (`/packages`)

This directory contains shared libraries and modules reused across applications in the workspace.

## Package List

### 1. [`/packages/types`](/packages/types)
Defines TypeScript models and data structures shared between workspaces.
*   Hand-curated exports in `index.ts` on top of the DTO types generated from the backend OpenAPI spec (`generated/`).

### 2. [`/packages/utils`](/packages/utils)
Contains generic utility modules.
*   Provides helper utilities such as formatting tools, common date functions, and math operations.

### 3. [`/packages/ui`](/packages/ui)
Reserved for common design components and visual elements.
*   Placeholder — currently empty, pending extraction of reusable components.

### 4. [`/packages/shared`](/packages/shared)
Reserved for shared logic.
*   Placeholder — currently empty.

---

## Workspace Integration

Packages in this workspace are linked locally using `pnpm` workspaces. They are referenced in application `package.json` configurations using standard workspace protocols:

```json
"dependencies": {
  "@packages/types": "workspace:*"
}
```

TypeScript compilation maps these imports directly via paths in the root configuration files to prevent build bottlenecks during development.
