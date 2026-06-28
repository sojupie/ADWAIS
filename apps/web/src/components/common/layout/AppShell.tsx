import {Outlet} from '@tanstack/react-router';
import type {Timeframe} from '../../../schemas';
import type {PersistentDomain} from '../../../utils/timeframeStorage';
import {MobileFooterPill} from '../ui/mobileFooterPill';
import {SiteHeader} from './SiteHeader';
import {MobileNavigationMenu} from './MobileNavigationMenu';
import {useMediaQuery} from '../../../hooks/useMediaQuery';
import {useVisualViewportCssVars} from '../../../hooks/useVisualViewportCssVars';

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
          />

          {isMobileMenuOpen && (
            <MobileNavigationMenu
              pathname={pathname}
              financialTimeframe={financialTimeframe}
              fleetTimeframe={fleetTimeframe}
              onClose={onCloseMobileMenu}
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
        <div className="app-main-scroll flex-1 w-full px-3 pt-3 relative flex flex-col min-h-0 overflow-y-auto contained:overflow-hidden custom-scrollbar">
          <div className="flex flex-col contained:flex-1 contained:min-h-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
