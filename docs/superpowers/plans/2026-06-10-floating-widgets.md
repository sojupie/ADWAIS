# Floating Widgets Hybrid Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `SyncStatusWidget` and `PeriodSelector` as hover-expandable components and integrate them into the tenant-specific diagnostics view.

**Architecture:** Use state-driven styling transitions to shrink widgets to a compact, dimmed (40% opacity) state when inactive on desktop, and expand smoothly on hover. Integrate them globally including the tenant diagnostics page.

**Tech Stack:** React, Tailwind CSS, TanStack Router

---

### Task 1: Refactor PeriodSelector Component

Modify the period selector to support hover-expandable functionality on desktop while remaining fully expanded inline on mobile.

**Files:**
- Modify: `apps/web/src/components/common/charts/PeriodSelector.tsx`

- [ ] **Step 1: Implement hover state and layout refactoring**

Verify the target file:
```typescript
import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { type PersistentDomain, setSavedTimeframe } from "../../../utils/timeframeStorage";
import type { Timeframe } from '../../../schemas';

interface PeriodSelectorProps {
  from: PersistentDomain;
}

export function PeriodSelector({ from }: PeriodSelectorProps ) {
  const navigate = useNavigate({ from });
  const search = useSearch({ strict: false });
  const timeframe = search.timeframe;
  const [isHovered, setIsHovered] = useState(false);

  const options = [
    { label: '1D', value: 'Today' },
    { label: '7D', value: 'T7' },
    { label: '30D', value: 'T30' },
    { label: '90D', value: 'T90' },
    { label: '365D', value: 'T365' },
    { label: 'YTD', value: 'Ytd' },
  ] as const;

  const handleSelect = (val: Timeframe) => {
    setSavedTimeframe(from, val);
    void navigate({ search: (old: Record<string, unknown>) => ({ ...old, timeframe: val }) });
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="grid grid-cols-3 gap-1 md:flex md:gap-1 bg-brand-bg-secondary p-1.5 rounded-xl md:rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-brand-bg-secondary/10 pointer-events-auto w-full md:w-auto max-w-[400px] md:max-w-none transition-all duration-350 ease-out"
    >
      {options.map((opt) => {
        const isActive = timeframe === opt.value;
        return (
          <button
            key={opt.value}
            id={`period-${opt.value}`}
            onClick={() => handleSelect(opt.value)}
            className={`px-2 py-2 md:px-5 text-[10px] md:text-xs font-black rounded-full transition-all duration-300 tracking-widest uppercase cursor-pointer text-center
              ${isActive 
                ? 'bg-brand-accent text-brand-bg-secondary shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }
              ${!isActive ? 'xl:w-0 xl:opacity-0 xl:overflow-hidden xl:px-0 xl:py-0' : 'xl:w-auto xl:opacity-100'}
              ${isHovered ? '!xl:w-auto !xl:opacity-100 !xl:px-5 !xl:py-2' : ''}
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/components/common/charts/PeriodSelector.tsx
git commit -m "feat: implement hover-expandable PeriodSelector"
```

---

### Task 2: Refactor SyncStatusWidget Component

Modify the sync status widget to support a compact, collapsed layout on desktop that expands dynamically. Add visual color cues based on sync errors.

**Files:**
- Modify: `apps/web/src/components/common/dashboard/SyncStatusWidget.tsx`

- [ ] **Step 1: Refactor layout and classes**

Replace the wrapper and circle classes inside `apps/web/src/components/common/dashboard/SyncStatusWidget.tsx`:

Add imports and state:
```typescript
import { useEffect, useState } from 'react';
// ... other imports
```

Update `SyncStatusWidget`:
```typescript
export function SyncStatusWidget() {
  // ... query and hook declarations
  const [isHovered, setIsHovered] = useState(false);
  // ... countdown and synchronization effects
```

Update outer wrapper `div`:
```typescript
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-3 py-2 border rounded-sm shadow-sm bg-brand-bg-secondary border-brand-bg-secondary/20 w-full md:w-auto max-w-100 md:max-w-none transition-all duration-350 ease-out
        ${isHovered ? 'xl:w-auto xl:opacity-100 xl:shadow-lg' : 'xl:w-[46px] xl:opacity-40 xl:overflow-hidden xl:px-2'}
      `}
    >
```

Update progress circle color to reflect health:
```typescript
  const isDrillDown = !!tenantId;
  const syncError = isDrillDown ? tenant?.lastSyncError : health?.sync?.globalSyncError;
  const strokeColor = syncError ? 'text-red-500' : 'text-[#51B5B9]';
```

And in the SVG circle element:
```typescript
          <circle 
            cx="18" cy="18" r="16" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="4" 
            strokeDasharray="100, 100"
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            className={`${strokeColor} transition-all duration-1000 ease-linear`}
          />
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/components/common/dashboard/SyncStatusWidget.tsx
git commit -m "feat: implement hover-expandable SyncStatusWidget with status colors"
```

---

### Task 3: Integrate Widgets into Tenant Diagnostics Page

Embed the widgets inside the `TenantDiagnostics` layout to match the global dashboard layout.

**Files:**
- Modify: `apps/web/src/pages/TenantDiagnostics.tsx`

- [ ] **Step 1: Add widget elements**

View imports in `TenantDiagnostics.tsx`:
```typescript
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
```

Add the widgets to the JSX layout before `</DashboardLayout>` matching `Financial.tsx` structure:
```tsx
      {/* ── Inline Widgets (Mobile/Tablet) ── */}
      <div className="xl:hidden flex flex-col md:flex-row justify-center gap-6 items-center w-full pb-6 shrink-0">
        <SyncStatusWidget />
        <PeriodSelector from="/financial" />
      </div>

      {/* ── Floating Widgets (Desktop Wide) ── */}
      <div className="hidden xl:block fixed bottom-6 left-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SyncStatusWidget />
      </div>
      <div className="hidden xl:block fixed bottom-6 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PeriodSelector from="/financial" />
      </div>
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/pages/TenantDiagnostics.tsx
git commit -m "feat: integrate SyncStatusWidget and PeriodSelector into TenantDiagnostics view"
```

---

### Task 4: Verify Compilation

Verify that the frontend builds without errors.

- [ ] **Step 1: Run build check**

Run: `pnpm --filter web build`
Expected: Succeeded with zero errors.

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "chore: verify successful web compilation"
```
