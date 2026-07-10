import { useState, useEffect } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import type { Timeframe } from '../../../schemas';
import type { PersistentDomain } from '../../../utils/timeframeStorage';
import { MobileFooterPill } from '../ui/mobileFooterPill';
import { SiteHeader } from './SiteHeader';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useVisualViewportCssVars } from '../../../hooks/useVisualViewportCssVars';
import { useOrderNotifier } from '../../../hooks/useOrderNotifier';

type AppShellProps = {
  pathname: string;
  isKioskRoute: boolean;
  isMobileMenuOpen: boolean;
  isOnline: boolean;
  isBackendOnline: boolean;
  userLabel: string | null;
  financialTimeframe: Timeframe;
  fleetTimeframe: Timeframe;
  timeframeDomain: PersistentDomain | null;
  onCloseMobileMenu: () => void;
  onToggleMobileMenu: () => void;
};

export function AppShell({
  pathname,
  isKioskRoute,
  isMobileMenuOpen,
  isOnline,
  isBackendOnline,
  userLabel,
  financialTimeframe,
  fleetTimeframe,
   timeframeDomain,
  onCloseMobileMenu,
  onToggleMobileMenu,
}: AppShellProps) {
  const isMobileView = useMediaQuery('(max-width: 767px)');
  useVisualViewportCssVars();
  useOrderNotifier();

  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isNavigating = useRouterState({ select: (s) => s.status === 'pending' });

  const showProgressBar = isNavigating || isFetching > 0 || isMutating > 0;

  const [isProgressBarVisible, setIsProgressBarVisible] = useState(false);

  useEffect(() => {
    let timer: any;
    
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

  return (
    <div className="app-shell flex flex-col bg-brand-bg-tertiary overflow-hidden select-none font-sans text-brand-text">
      {!isKioskRoute && (
        <>
          <SiteHeader
            financialTimeframe={financialTimeframe}
            fleetTimeframe={fleetTimeframe}
            isMobileMenuOpen={isMobileMenuOpen}
            isOnline={isOnline}
            isBackendOnline={isBackendOnline}
            userLabel={userLabel}
            onToggleMobileMenu={onToggleMobileMenu}
            isProgressBarVisible={isProgressBarVisible}
          />

          {isMobileMenuOpen && (
            <MobileNavigationMenu
              pathname={pathname}
              financialTimeframe={financialTimeframe}
              fleetTimeframe={fleetTimeframe}
              onClose={onCloseMobileMenu}
              userLabel={userLabel}
            />
          )}

          {isMobileView && timeframeDomain && (
            <div className="mobile-float-pills">
              <MobileFooterPill domain={timeframeDomain} />
            </div>
          )}
        </>
      )}

      <main className="app-main flex-1 min-h-0 relative flex flex-col">
        <div className="app-main-scroll bg-surface-container-low flex-1 w-full px-3 pt-3 relative flex flex-col min-h-0 overflow-y-auto contained:overflow-hidden custom-scrollbar">
          <div className="flex flex-col contained:flex-1 contained:min-h-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
