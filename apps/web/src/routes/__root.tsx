import { createRootRoute, Link, Outlet, useRouterState} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Settings } from 'lucide-react';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { KioskControls } from '../components/common/dashboard/KioskControls';
import motilloLogo from '../assets/motillo-logo.svg';
import { getSavedTimeframe } from '../utils/timeframeStorage';

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
          <Link
            to="/financial"
            search={{ timeframe: financialTf }}
            activeOptions={{ includeSearch: false }}
            className="text-sm font-extrabold text-white/60 hover:text-white transition-all no-underline pb-1 border-b-4 border-transparent uppercase tracking-wider"
            activeProps={{ className: '!text-brand-accent !border-brand-accent' }}
          >
            Financial
          </Link>
          <Link
            to="/fleet-status"
            search={{ timeframe: fleetTf }}
            activeOptions={{ includeSearch: false }}
            className="text-sm font-extrabold text-white/60 hover:text-white transition-all no-underline pb-1 border-b-4 border-transparent uppercase tracking-wider"
            activeProps={{ className: '!text-brand-accent !border-brand-accent' }}
          >
            Fleet Status
          </Link>
          <Link
            to="/intranet"
            className="text-sm font-extrabold text-white/60 hover:text-white transition-all no-underline pb-1 border-b-4 border-transparent uppercase tracking-wider"
            activeProps={{ className: '!text-brand-accent !border-brand-accent' }}
          >
            Intranet
          </Link>
          <Link
            to="/settings"
            className="p-1 text-white/60 hover:text-white transition-all"
            activeProps={{ className: '!text-brand-accent' }}
            title="Settings & Administration"
          >
            <Settings size={20} />
          </Link>
        </nav>

        <div className="w-full xl:w-1/4 flex justify-center xl:justify-end">
          <KioskControls />
        </div>
      </header>

      {/* ── Main Area ── */}
      <main className="flex-1 min-h-0 relative flex flex-col">
        <div className="flex-1 w-full custom-scrollbar overflow-y-auto px-6 py-6 relative flex flex-col">
          <Outlet />

          {/* ── Mobile Inline Widgets ── */}
          {(isFinancial || isFleet) && (
            <div className="md:hidden mt-8 flex flex-col gap-4 items-center w-full max-w-full overflow-x-auto no-scrollbar pb-6">
              <PeriodSelector from={isFinancial ? '/financial' : '/fleet-status'} />
              <SyncStatusWidget />
            </div>
          )}
        </div>

        {/* ── Floating Sync Status (Desktop) ── */}
        {(isFinancial || isFleet) && (
          <div className="hidden md:block absolute bottom-6 left-6 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SyncStatusWidget />
          </div>
        )}

        {/* ── Floating Period Selector (Desktop) ── */}
        {(isFinancial || isFleet) && (
          <div className="hidden md:block absolute bottom-6 right-8 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PeriodSelector from={isFinancial ? '/financial' : '/fleet-status'} />
          </div>
        )}
      </main>

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </div>
  );
}
