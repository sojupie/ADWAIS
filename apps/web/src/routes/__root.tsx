import {createRootRoute, redirect, useRouterState, useSearch} from '@tanstack/react-router';
import {useContext} from 'react';
import {AuthContext, hasAuthParams} from 'react-oidc-context';
import {isDemoMode, userManager} from '../utils/oidcConfig';
import {getKioskToken} from '../utils/auth';
import {getSavedTimeframe, type PersistentDomain} from '../utils/timeframeStorage';
import {useCurrentUser} from '../hooks/useCurrentUser';
import {useConnectivityStatus} from '../hooks/useConnectivityStatus';
import {useMobileMenu} from '../hooks/useMobileMenu';
import {RootProviders} from '../components/common/layout/RootProviders';
import {AuthRouteShell} from '../components/common/layout/AuthRouteShell';
import {AppShell} from '../components/common/layout/AppShell';

export const Route = createRootRoute({
  beforeLoad: async ({location}) => {
    const isLoginRoute = location.pathname === '/login';
    const isKioskRoute = location.pathname.startsWith('/kiosk');

    if (isLoginRoute || isKioskRoute) return;
    if (getKioskToken()) return;
    if (hasAuthParams()) return;

    if (isDemoMode) return;

    const user = await userManager?.getUser();
    if (!user || user.expired) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  useSearch({strict: false});

  const auth = useContext(AuthContext);
  const {user} = useCurrentUser();
  const {isOnline, isBackendOnline} = useConnectivityStatus();
  const location = useRouterState({select: (state) => state.location});
  const mobileMenu = useMobileMenu(location.pathname);

  const financialTimeframe = getSavedTimeframe('/financial');
  const fleetTimeframe = getSavedTimeframe('/fleet-status');
  const isFinancialPage = location.pathname === '/financial' || location.pathname.startsWith('/financial/');
  const isFleetPage = location.pathname === '/fleet-status' || location.pathname.startsWith('/fleet-status/');
  const timeframeDomain: PersistentDomain | null = isFinancialPage ? '/financial' : isFleetPage ? '/fleet-status' : null;

  const kioskToken = getKioskToken();
  const userLabel = kioskToken ? 'Kiosk' : (user?.name || auth?.user?.profile?.name || null);
  const isAuthRoute = location.pathname === '/login' || location.pathname.startsWith('/kiosk');

  return (
    <RootProviders>
      {isAuthRoute ? (
        <AuthRouteShell routeKey={location.pathname} />
      ) : (
        <AppShell
          pathname={location.pathname}
          isKioskRoute={location.pathname.startsWith('/kiosk')}
          isMobileMenuOpen={mobileMenu.isOpen}
          isOnline={isOnline}
          isBackendOnline={isBackendOnline}
          userLabel={userLabel}
          financialTimeframe={financialTimeframe}
          fleetTimeframe={fleetTimeframe}
          timeframeDomain={timeframeDomain}
          onCloseMobileMenu={mobileMenu.close}
          onToggleMobileMenu={mobileMenu.toggle}
        />
      )}
    </RootProviders>
  );
}
