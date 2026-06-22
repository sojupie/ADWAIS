import { useState, useEffect } from 'react';
import { createRootRoute, Outlet, useSearch, useRouterState, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Settings, WifiOff, ServerCrash } from 'lucide-react';
import { KioskControls } from '../components/common/dashboard/KioskControls';
import { KioskProvider } from '../components/common/dashboard/KioskProvider';
import motilloLogo from '../assets/motillo-logo.svg';
import { getSavedTimeframe } from '../utils/timeframeStorage';
import {NavLink} from "../components/common/layout/NavLink.tsx";
import { Toaster } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { msalInstance } from '../utils/msalConfig';
import { getKioskToken } from '../utils/auth';
import { AuthLayout } from '../components/common/layout/AuthLayout';
import { AuthCard } from '../components/common/layout/AuthCard';

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const isLoginRoute = location.pathname === '/login';
    const isKioskRoute = location.pathname.startsWith('/kiosk');
    
    if (isLoginRoute || isKioskRoute) return;
    if (getKioskToken()) return;

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw redirect({
        to: '/login'
      });
    }
  },
  component: RootComponent
});

function RootComponent() {
  useSearch({ strict: false });
  const { accounts } = useMsal();
  const { user } = useCurrentUser();
  const hasMsalAccount = accounts.length > 0;

  const financialTf = getSavedTimeframe('/financial');
  const fleetTf = getSavedTimeframe('/fleet-status');
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isNavigating = useRouterState({ select: (s) => s.status === 'pending' });
  const location = useRouterState({ select: (s) => s.location });
  const isKioskRoute = location.pathname.startsWith('/kiosk');

  const showProgressBar = isNavigating || isFetching > 0 || isMutating > 0;

  const [isProgressBarVisible, setIsProgressBarVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (showProgressBar) {
      const defer = setTimeout(() => {
        setIsProgressBarVisible(true);
      }, 0);
      return () => clearTimeout(defer);
    } else {
      timer = setTimeout(() => {
        setIsProgressBarVisible(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [showProgressBar]);

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

  const isAuthRoute = location.pathname === '/login' || location.pathname.startsWith('/kiosk');

  if (isAuthRoute) {
    return (
      <KioskProvider>
        <AuthLayout>
          <AuthCard>
            <div key={location.pathname} className="flex-1 flex flex-col justify-between min-h-full">
              <Outlet />
            </div>
          </AuthCard>
        </AuthLayout>
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
        {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
        <Toaster closeButton richColors theme="light" />
      </KioskProvider>
    );
  }

  return (
    <KioskProvider>
      <div className="flex flex-col h-screen w-screen bg-brand-bg-tertiary overflow-hidden select-none font-sans text-brand-text">
        {/* ── Header ── */}
        {!isKioskRoute && (
          <header className="relative flex flex-col xl:flex-row justify-between items-center px-6 py-3 shrink-0 bg-brand-bg-secondary border-b border-brand-bg-secondary/20 shadow-sm z-10 gap-4 xl:gap-0">
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
            <KioskControls />
          </div>

          <style>{`
            @keyframes loading-bar {
              0% { left: -35%; width: 35%; }
              100% { left: 100%; width: 35%; }
            }
            .animate-loading-bar {
              animation: loading-bar 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
          `}</style>
          <div 
            className="absolute bottom-0 left-0 right-0 h-[6px] translate-y-full z-50 overflow-hidden bg-brand-btn-primary/20 pointer-events-none transition-opacity duration-500"
            style={{ opacity: isProgressBarVisible ? 1 : 0 }}
          >
            <div 
              className="absolute top-0 bottom-0 animate-loading-bar rounded-full" 
              style={{
                left: '-35%',
                width: '35%',
                background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-brand-accent) 0%, transparent) 0%, color-mix(in srgb, var(--color-brand-accent) 95%, transparent) 50%, var(--color-brand-accent) 100%)',
                boxShadow: '0 0 16px 3px var(--color-brand-accent), 0 0 8px 1px var(--color-brand-accent), 0 0 4px var(--color-brand-accent)'
              }}
            />
          </div>
        </header>
        )}

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
        <Toaster closeButton richColors theme="light" />
      </div>
    </KioskProvider>
  );
}
