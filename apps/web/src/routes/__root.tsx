import { useState, useEffect } from 'react';
import { createRootRoute, Outlet, useSearch } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useQueryClient } from '@tanstack/react-query';
import { Settings, WifiOff, ServerCrash } from 'lucide-react';
import { KioskControls } from '../components/common/dashboard/KioskControls';
import { KioskProvider } from '../components/common/dashboard/KioskProvider';
import motilloLogo from '../assets/motillo-logo.svg';
import { getSavedTimeframe } from '../utils/timeframeStorage';
import {NavLink} from "../components/common/layout/NavLink.tsx";

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  useSearch({ strict: false });
  const financialTf = getSavedTimeframe('/financial');
  const fleetTf = getSavedTimeframe('/fleet-status');
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const isConnectivityError = (err: unknown): boolean => {
      if (!err) return false;
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      return (
        msg.includes('502') ||
        msg.includes('bad gateway') ||
        msg.includes('failed to fetch') ||
        msg.includes('network error') ||
        msg.includes('504') ||
        msg.includes('gateway timeout') ||
        msg.includes('connection refused') ||
        msg.includes('load failed')
      );
    };

    const checkCache = () => {
      const queries = queryClient.getQueryCache().getAll();
      const hasConnectionError = queries.some(q => isConnectivityError(q.state.error));
      setIsBackendOnline(!hasConnectionError);
    };

    checkCache();

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated') {
        checkCache();
      }
    });

    return unsubscribe;
  }, [queryClient]);

  return (
    <KioskProvider>
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

          <div className="w-full xl:w-1/4 flex justify-center xl:justify-end items-center gap-4">
            {!isOnline && (
              <span 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-red-600 bg-red-50 border border-red-200 uppercase tracking-wider animate-in fade-in duration-300"
                title="Application is offline"
              >
                <WifiOff size={14} className="animate-pulse" />
                Offline
              </span>
            )}
            {isOnline && !isBackendOnline && (
              <span 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-amber-600 bg-amber-50 border border-amber-200 uppercase tracking-wider animate-in fade-in duration-300"
                title="Backend server is unreachable (502 / bad gateway)"
              >
                <ServerCrash size={14} className="animate-pulse" />
                Server Offline
              </span>
            )}
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
    </KioskProvider>
  );
}
