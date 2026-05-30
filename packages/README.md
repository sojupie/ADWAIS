# Shared Packages (`/packages`)

This directory contains shared libraries and modules reused across applications in the workspace.

## Package List

### 1. [`/packages/types`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/packages/types)
Defines TypeScript models and data structures shared between workspaces.
*   Enforces structure mappings for responses from the .NET Web API.
*   Contains schemas utilized by Zod.

### 2. [`/packages/ui`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/packages/ui)
Houses common design components and visual elements.
*   Ensures design system consistency across separate user-facing components.

### 3. [`/packages/utils`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/packages/utils)
Contains generic utility modules.
*   Provides helper utilities such as formatting tools, common date functions, and math operations.

---

## Workspace Integration

Packages in this workspace are linked locally using `pnpm` workspaces. They are referenced in application `package.json` configurations using standard workspace protocols:

```json
"dependencies": {
  "@packages/types": "workspace:*"
}
```

TypeScript compilation maps these imports directly via paths in the root configuration files to prevent build bottlenecks during development.
