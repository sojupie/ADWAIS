import { createRootRoute, Outlet, useRouterState} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Settings } from 'lucide-react';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { KioskControls } from '../components/common/dashboard/KioskControls';
import motilloLogo from '../assets/motillo-logo.svg';
import { getSavedTimeframe } from '../utils/timeframeStorage';
import {NavLink} from "../components/common/layout/NavLink.tsx";

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  const matches = useRouterState({ select: (s) => s.matches });

  const financialTf = getSavedTimeframe('/financial');
  const fleetTf = getSavedTimeframe('/fleet-status');

  const isFinancial = matches.some((m) => m.routeId === '/financial' || m.pathname.includes('/financial'));
  const isFleet = matches.some((m) => m.routeId === '/fleet-status' || m.pathname.includes('/fleet-status'));

  return (
    <div className="flex flex-col h-screen w-screen bg-brand-bg-tertiary overflow-hidden select-none font-sans text-brand-text">
      {/* ── Header ── */}
      <header className="flex flex-col xl:flex-row justify-between items-center px-6 py-3 shrink-0 bg-brand-bg-secondary border-b border-brand-bg-secondary/20 shadow-sm z-10 gap-4 xl:gap-0">
        <div className="w-full xl:w-1/4 flex justify-center xl:justify-start">
          <img className="h-8 w-auto object-contain object-left brightness-0 invert" src={motilloLogo} alt="Motillo" height="32" />
        </div>

        <nav className="flex-1 flex flex-wrap justify-center items-center gap-4 md:gap-8 w-full xl:w-auto">
          <NavLink to={"/financial"} search={{ timeframe: financialTf }}>
            Financial
          </NavLink>
          <NavLink to={"/fleet-status"} search={{ timeframe: fleetTf }}>
            Fleet status
          </NavLink>
          <NavLink to={"/intranet"}>Intranet</NavLink>
          <NavLink to={"/settings"}> <Settings size={20}/> </NavLink>
        </nav>

        <div className="w-full xl:w-1/4 flex justify-center xl:justify-end">
          <KioskControls />
        </div>
      </header>

      {/* ── Main Area ── */}
      <main className="flex-1 min-h-0 relative flex flex-col">
        <div className="flex-1 w-full px-6 pt-6 relative flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
          <div className="flex-1 pb-6 flex flex-col min-h-0">
            <Outlet />
          </div>
        </div>
      </main>

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </div>
  );
}
