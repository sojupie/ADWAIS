import { useState, useEffect } from 'react';
import { createRootRoute, Outlet, useSearch, useRouterState, redirect, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Settings, WifiOff, ServerCrash, Menu, X, SlidersHorizontal } from 'lucide-react';
import { KioskControls } from '../components/common/dashboard/KioskControls';
import { KioskProvider } from '../components/common/dashboard/KioskProvider';
import motilloLogo from '../assets/motillo-logo.svg';
import { getSavedTimeframe, type PersistentDomain } from '../utils/timeframeStorage';
import { NavLink } from "../components/common/layout/NavLink.tsx";
import { Toaster } from 'sonner';
import { useMsal } from '@azure/msal-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { msalInstance } from '../utils/msalConfig';
import { getKioskToken } from '../utils/auth';
import { AuthLayout } from '../components/common/layout/AuthLayout';
import { AuthCard } from '../components/common/layout/AuthCard';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';

/** Single floating action pill — mobile equivalent of the desktop DashboardFooter.
 *  Expands upward to show PeriodSelector + SyncStatusWidget. Closes on backdrop click.
 */
function MobileFooterPill({ domain }: { domain: PersistentDomain }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative z-40 flex flex-col items-end gap-3">
        {isOpen && (
          <div className="flex flex-col gap-0 bg-brand-bg-secondary/75 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] w-[min(90vw,360px)]">
            <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">Timeframe</span>
              <PeriodSelector from={domain} />
            </div>
            <div className="h-px bg-white/10 mx-4" />
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">Sync Status</span>
              <SyncStatusWidget />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl border transition-colors ${isOpen
              ? 'bg-brand-accent text-brand-bg-secondary border-brand-accent/40'
              : 'bg-brand-bg-secondary text-white border-white/15 hover:bg-brand-bg-quaternary'
            }`}
          aria-label="Toggle timeframe and sync panel"
          aria-expanded={isOpen}
        >
          <SlidersHorizontal size={15} />
          Actions
        </button>
      </div>
    </>
  );
}

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
  }

  const isFinancialPage = location.pathname === '/financial' || location.pathname.startsWith('/financial/');
  const isFleetPage = location.pathname === '/fleet-status' || location.pathname.startsWith('/fleet-status/');
  const timeframeDomain: PersistentDomain | null = isFinancialPage ? '/financial' : isFleetPage ? '/fleet-status' : null;

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
          <>
            <header className="site-header relative shrink-0 bg-brand-bg-secondary border-b border-brand-bg-secondary/20 shadow-sm z-10 px-6 py-3">
              {/* Mobile Bar */}
              <div className="site-header__mobile-bar" data-header="mobile-bar">
                <img className="h-7 w-auto object-contain object-left brightness-0 invert" src={motilloLogo} alt="Motillo" height="28" />
                <div className="flex items-center gap-2">
                  {!isOnline && (
                    <span
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-extrabold text-red-400 bg-red-950/40 border border-red-800/40 uppercase tracking-wider whitespace-nowrap shrink-0"
                      title="Application is offline"
                    >
                      <WifiOff size={12} className="animate-pulse" />
                      <span>Offline</span>
                    </span>
                  )}
                  {isOnline && !isBackendOnline && (
                    <span
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-extrabold text-amber-400 bg-amber-950/40 border border-amber-800/40 uppercase tracking-wider whitespace-nowrap shrink-0"
                      title="Backend server is unreachable"
                    >
                      <ServerCrash size={12} className="animate-pulse" />
                      <span>Server</span>
                    </span>
                  )}
                  {(hasMsalAccount || !!getKioskToken()) && (
                    <Link
                      to="/settings/authentication"
                      className="flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 max-w-[120px] truncate"
                    >
                      {getKioskToken() ? 'Kiosk' : (user?.name || accounts[0]?.name || accounts[0]?.username)}
                    </Link>
                  )}
                  <button
                    onClick={() => setIsMobileMenuOpen(v => !v)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
                    aria-label="Toggle menu"
                  >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>

              {/* Logo */}
              <div className="site-header__logo flex justify-start" data-header="logo">
                <img className="h-8 w-auto object-contain object-left brightness-0 invert" src={motilloLogo} alt="Motillo" height="32" />
              </div>

              {/* Nav */}
              <nav className="site-header__nav flex items-center gap-4" style={{ marginBottom: '-8px' }} data-header="nav">
                <NavLink to={"/financial"} search={{ timeframe: financialTf }}>
                  Financial
                </NavLink>
                <NavLink to={"/fleet-status"} search={{ timeframe: fleetTf }}>
                  Fleet status
                </NavLink>
                <NavLink to={"/intranet"}>Intranet</NavLink>
                <NavLink to={"/settings"}> <Settings size={20} /> </NavLink>
              </nav>

              {/* Controls */}
              <div className="site-header__controls flex justify-center items-center gap-2" data-header="controls">
                <div className="flex items-center gap-4">
                  {!isOnline && (
                    <span
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-red-600 bg-red-50 border border-red-200 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap shrink-0"
                      title="Application is offline"
                    >
                      <WifiOff size={14} className="animate-pulse" />
                      <span>Offline</span>
                    </span>
                  )}
                  {isOnline && !isBackendOnline && (
                    <span
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-amber-600 bg-amber-50 border border-amber-200 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap shrink-0"
                      title="Backend server is unreachable (502 / bad gateway)"
                    >
                      <ServerCrash size={14} className="animate-pulse" />
                      <span>Server Offline</span>
                    </span>
                  )}
                  {(hasMsalAccount || !!getKioskToken()) && (
                    <Link
                      to="/settings/authentication"
                      className="flex items-center gap-3 bg-brand-bg-primary/45 hover:bg-brand-bg-primary/60 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap shrink-0 text-sm font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      {getKioskToken() ? 'Kiosk' : (user?.name || accounts[0]?.name || accounts[0]?.username)}
                    </Link>
                  )}
                </div>
                <KioskControls />
              </div>

              <style>{`
            /* ── Header Responsive Layout ── */

            /* Mobile bar hidden by default (shown only < 768px) */
            .site-header__mobile-bar {
              display: none;
            }

            /* Default: flex column */
            .site-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-wrap: wrap;
            }
            .site-header > * + * {
              margin-top: 0.75rem;
            }

            /* Mobile (< 768px): Show only mobile bar, hide desktop nav */
            @media (max-width: 767px) {
              .site-header {
                flex-direction: row !important;
                align-items: center !important;
                flex-wrap: nowrap !important;
                padding: 0.5rem 1rem !important;
              }
              .site-header > * + * {
                margin-top: 0 !important;
              }
              .site-header__mobile-bar {
                display: flex;
                width: 100%;
                justify-content: space-between;
                align-items: center;
              }
              .site-header__logo,
              .site-header__nav,
              .site-header__controls {
                display: none !important;
              }
            }

            /* Floating action pills: hidden on desktop, fixed bottom-right on mobile */
            .mobile-float-pills {
              display: none;
            }
            @media (max-width: 767px) {
              .mobile-float-pills {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.5rem;
                position: fixed;
                bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
                right: 0.75rem;
                z-index: 40;
                pointer-events: auto;
              }
            }

            /* Medium (≥ 768px): flex-wrap row — logo forces own row,
               nav + controls auto-wrap to separate rows if they don't fit */
            @media (min-width: 768px) {
              .site-header {
                flex-direction: row;
                flex-wrap: wrap;
              }
              .site-header > * + * {
                margin-top: 0;
              }
              .site-header > * {
                margin-top: 0.375rem;
                margin-bottom: 0.375rem;
              }
              .site-header__logo {
                flex: 0 0 100%;
              }
              .site-header__nav {
                flex: 0 0 auto;
                flex-wrap: nowrap;
                white-space: nowrap;
              }
              .site-header__controls {
                flex: 0 0 auto;
                margin-left: auto;
              }
              .site-header__controls,
              .site-header__controls > div {
                flex-wrap: nowrap;
              }
            }

            /* Wide (≥ 1024px): CSS Grid single row — logo | nav centered | controls right */
            @media (min-width: 1024px) {
              .site-header {
                display: grid;
                grid-template-columns: auto 1fr auto;
                grid-template-rows: auto;
                gap: 1.5rem;
                flex-wrap: nowrap;
              }
              .site-header > * {
                margin: 0;
              }
              .site-header > * + * {
                margin-top: 0;
              }
              .site-header__logo {
                grid-column: 1;
                grid-row: 1;
                justify-self: start;
                flex: none;
              }
              .site-header__nav {
                grid-column: 2;
                grid-row: 1;
                justify-self: center;
                justify-content: center;
                flex: none;
                flex-wrap: nowrap;
                white-space: nowrap;
              }
              .site-header__controls {
                grid-column: 3;
                grid-row: 1;
                justify-self: end;
                margin-left: 0;
                flex: none;
              }
            }

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
                    background: 'linear-gradient(90deg, rgba(255, 206, 68, 0) 0%, rgba(255, 206, 68, 0.95) 50%, rgba(255, 206, 68, 1) 100%)',
                    boxShadow: '0 0 16px 3px var(--color-brand-accent), 0 0 8px 1px var(--color-brand-accent), 0 0 4px var(--color-brand-accent)'
                  }}
                />
              </div>
            </header>

            {/* ── Mobile Menu Overlay ── */}
            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg-secondary" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
                  <img className="h-7 w-auto object-contain object-left brightness-0 invert" src={motilloLogo} alt="Motillo" height="28" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex-1 overflow-y-auto bg-brand-bg-secondary custom-scrollbar px-5 py-6 flex flex-col gap-8">
                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-1" aria-label="Main navigation">
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 px-3">Navigation</span>
                    <Link
                      to="/financial"
                      search={{ timeframe: financialTf }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-3 rounded-lg text-base font-bold transition-colors ${location.pathname === '/financial'
                          ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                      aria-current={location.pathname === '/financial' ? 'page' : undefined}
                    >
                      Financial
                    </Link>
                    <Link
                      to="/fleet-status"
                      search={{ timeframe: fleetTf }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-3 rounded-lg text-base font-bold transition-colors ${location.pathname.startsWith('/fleet-status')
                          ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                      aria-current={location.pathname.startsWith('/fleet-status') ? 'page' : undefined}
                    >
                      Fleet Status
                    </Link>
                    <Link
                      to="/intranet"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-3 rounded-lg text-base font-bold transition-colors ${location.pathname === '/intranet'
                          ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                      aria-current={location.pathname === '/intranet' ? 'page' : undefined}
                    >
                      Intranet
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3 py-3 rounded-lg text-base font-bold transition-colors flex items-center gap-2 ${location.pathname.startsWith('/settings')
                          ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                      aria-current={location.pathname.startsWith('/settings') ? 'page' : undefined}
                    >
                      <Settings size={18} />
                      Settings
                    </Link>
                  </nav>
                </div>

              </div>
            )}
            {/* ── Mobile Footer Pill (mobile only, dashboard pages only) ── */}
            {timeframeDomain && (
              <div className="mobile-float-pills">
                <MobileFooterPill domain={timeframeDomain} />
              </div>
            )}
          </>
        )}

        {/* ── Main Area ── */}
        <main className="flex-1 min-h-0 relative flex flex-col">
          <div
            className="flex-1 w-full px-3 pt-3 relative flex flex-col min-h-0 overflow-y-auto contained:overflow-hidden custom-scrollbar"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex flex-col contained:flex-1 contained:min-h-0">
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
