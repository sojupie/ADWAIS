# Kiosk Header Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the header layout in `__root.tsx` to wrap responsively, ensuring 1 row on desktop, 2 rows on tablet (with Logo/Nav on Row 1 and Status/Controls on Row 2), and 3 rows on mobile, maintaining status on the left and kiosk controls on the right when wrapped.

**Architecture:** Utilize Tailwind responsive flexbox utilities on the three direct children of the `<header>` element without introducing unnecessary wrapper divs.

**Tech Stack:** React, Tailwind CSS, TypeScript

---

### Task 1: Update Header Layout in __root.tsx

**Files:**
- Modify: `apps/web/src/routes/__root.tsx:145-190`
- Test: Build the web frontend to ensure there are no compilation/TypeScript errors.

- [ ] **Step 1: Replace header and children classes**

Modify `apps/web/src/routes/__root.tsx` to use the responsive flexbox layout classes:

```tsx
        {!isKioskRoute && (
          <header className="relative flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap xl:flex-row justify-between items-center px-6 py-3 shrink-0 bg-brand-bg-secondary border-b border-brand-bg-secondary/20 shadow-sm z-10 gap-4 md:gap-y-3 xl:gap-0">
            <div className="w-full md:w-auto xl:w-1/4 flex justify-center md:justify-start">
              <img className="h-8 w-auto object-contain object-left brightness-0 invert" src={motilloLogo} alt="Motillo" height="32" />
            </div>

          <nav className="flex flex-wrap justify-center items-center gap-4 md:gap-8 w-full md:w-auto xl:flex-1 xl:justify-center">
            <NavLink to={"/financial"} search={{ timeframe: financialTf }}>
              Financial
            </NavLink>
            <NavLink to={"/fleet-status"} search={{ timeframe: fleetTf }}>
              Fleet status
            </NavLink>
            <NavLink to={"/intranet"}>Intranet</NavLink>
            <NavLink to={"/settings"}> <Settings size={20}/> </NavLink>
          </nav>

          <div className="w-full md:w-full xl:w-1/4 flex justify-between md:justify-between xl:justify-end items-center gap-4">
            <div className="flex items-center gap-4">
              {!isOnline && (
                <span 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-red-600 bg-red-50 border border-red-200 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap shrink-0"
                  title="Application is offline"
                >
                  <WifiOff size={14} className="animate-pulse" />
                  Offline
                </span>
              )}
              {isOnline && !isBackendOnline && (
                <span 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-amber-600 bg-amber-50 border border-amber-200 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap shrink-0"
                  title="Backend server is unreachable (502 / bad gateway)"
                >
                  <ServerCrash size={14} className="animate-pulse" />
                  Server Offline
                </span>
              )}
              {hasMsalAccount && (
                <div className="flex items-center gap-3 bg-brand-bg-primary/45 border border-white/10 px-3.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap shrink-0">
                  <span className="text-sm font-bold text-slate-300">
                    {user?.name || accounts[0]?.name || accounts[0]?.username}
                  </span>
                </div>
              )}
            </div>
            <KioskControls />
          </div>
```

- [ ] **Step 2: Run frontend build to verify compilation**

Run: `pnpm --filter web build` in the root workspace directory.
Expected: Build passes with no errors.

- [ ] **Step 3: Commit changes**

```bash
git add apps/web/src/routes/__root.tsx
git commit -m "style: responsive header navigation and kiosk layout"
```
