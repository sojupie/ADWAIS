# Design Spec: Hover-Expandable Floating Dashboard Widgets

* **Date**: 2026-06-10
* **Author**: Antigravity
* **Status**: Approved

---

## 1. Objectives

Redesign `SyncStatusWidget` and `PeriodSelector` to implement a hybrid (collapsed/expanded) interactive design to prevent overlapping with chart contents, specifically x-axis labels. Integrate these components into the drill-down view (`TenantDiagnostics.tsx`) to achieve consistency across all main pages.

---

## 2. Proposed Changes

### A. Layout Integration
* Update `PeriodSelector.tsx` and `SyncStatusWidget.tsx` core implementations. Because they are shared components, updates apply globally to [Financial.tsx](file:///C:/Users/ollem/Git/motillo%20project/ADWAIS/apps/web/src/pages/Financial.tsx), [FleetStatus.tsx](file:///C:/Users/ollem/Git/motillo%20project/ADWAIS/apps/web/src/pages/FleetStatus.tsx), and [TenantDiagnostics.tsx](file:///C:/Users/ollem/Git/motillo%20project/ADWAIS/apps/web/src/pages/TenantDiagnostics.tsx).
* Include both components inside [TenantDiagnostics.tsx](file:///C:/Users/ollem/Git/motillo%20project/ADWAIS/apps/web/src/pages/TenantDiagnostics.tsx) using the same desktop-floating and mobile-inline layouts.

### B. Interactive Behavior & Styling

The components will transition smoothly between two states on desktop (`xl` breakpoint and above) using CSS transition animations. On mobile/tablet, they will render in their fully expanded state inline at the bottom of the container.

#### 1. Collapsed State (Default Inactive)
* **Opacity**: Dimmed to `opacity-40` (`hover:opacity-100`).
* **PeriodSelector**:
  * Shows only the active timeframe label (e.g., "7D" or "30D") in a compact rounded glassmorphic container (`backdrop-blur-md bg-slate-900/40 border border-slate-700/20`).
* **SyncStatusWidget**:
  * Displays only the countdown wheel (miniaturized) and a pulsing status indicator dot.

#### 2. Expanded State (Hovered/Active)
* **Opacity**: Full `opacity-100` with shadow effects.
* **Transition**: Smooth horizontal expansion using `transition-all duration-350 ease-out`.
* **PeriodSelector**:
  * Expands horizontally to show all time-span options ('1D', '7D', '30D', '90D', '365D', 'YTD').
* **SyncStatusWidget**:
  * Expands horizontally to show all info rows (Dash UI sync time, Meta data sync, and API sync status) and the manual refresh button.

---

## 3. Component Details

### `PeriodSelector.tsx`
* Update layout to support collapsed/expanded state.
* Track active period and render the shorthand label when collapsed.
* Expand container width on hover/focus.

### `SyncStatusWidget.tsx`
* Render a compact layout when collapsed (width restricted to icon size).
* Show detail tables and force fetch action button only when hovered/focused.

---

## 4. Implementation Steps

1. **Refactor `PeriodSelector.tsx`**: Add state and Tailwind/CSS classes for the hover expansion effect.
2. **Refactor `SyncStatusWidget.tsx`**: Structure HTML and classes for smooth width expansion and detail row visibility on hover.
3. **Update `TenantDiagnostics.tsx`**: Include inline and floating widgets.
4. **Validate**: Run `pnpm --filter web build` to ensure zero type or compilation errors.
