import {Menu, Settings, X} from 'lucide-react';
import type {Timeframe} from '../../../schemas';
import {KioskControls} from '../dashboard/KioskControls';
import {NavLink} from './NavLink';
import {ConnectivityStatus} from './ConnectivityStatus';
import {UserAccountLink} from './UserAccountLink';
import {MotilloLogoLink} from './MotilloLogoLink';
import {useMediaQuery} from '../../../hooks/useMediaQuery';

type SiteHeaderProps = {
  financialTimeframe: Timeframe;
  fleetTimeframe: Timeframe;
  isMobileMenuOpen: boolean;
  isOnline: boolean;
  isBackendOnline: boolean;
  userLabel: string | null;
  onToggleMobileMenu: () => void;
};

export function SiteHeader({
  financialTimeframe,
  fleetTimeframe,
  isMobileMenuOpen,
  isOnline,
  isBackendOnline,
  userLabel,
  onToggleMobileMenu,
}: SiteHeaderProps) {
  const isMobileView = useMediaQuery('(max-width: 767px)');

  return (
    <header className="site-header relative shrink-0 bg-brand-bg-secondary border-b border-brand-bg-secondary/20 shadow-sm z-10 px-6 py-3">
      {isMobileView ? (
        <div className="site-header__mobile-bar" data-header="mobile-bar">
          <MotilloLogoLink
            timeframe={financialTimeframe}
            className="h-7 w-auto object-contain object-left brightness-0 invert"
            height={28}
          />
          <div className="flex items-center gap-2">
            <ConnectivityStatus isOnline={isOnline} isBackendOnline={isBackendOnline} variant="mobile" />
            <UserAccountLink label={userLabel} variant="mobile" />
            <button
              onClick={onToggleMobileMenu}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="site-header__logo flex justify-start" data-header="logo">
            <MotilloLogoLink
              timeframe={financialTimeframe}
              className="h-8 w-auto object-contain object-left brightness-0 invert"
              height={32}
            />
          </div>

          <nav className="site-header__nav flex items-center gap-4 mb-[-8px]" data-header="nav">
            <NavLink to="/financial" search={{timeframe: financialTimeframe}}>
              Financial
            </NavLink>
            <NavLink to="/fleet-status" search={{timeframe: fleetTimeframe}}>
              Fleet status
            </NavLink>
            <NavLink to="/intranet">Intranet</NavLink>
            <NavLink to="/settings"><Settings size={20} /></NavLink>
          </nav>

          <div className="site-header__controls flex justify-center items-center gap-2" data-header="controls">
            <div className="flex items-center gap-4">
              <ConnectivityStatus isOnline={isOnline} isBackendOnline={isBackendOnline} variant="desktop" />
              <UserAccountLink label={userLabel} variant="desktop" />
            </div>
            <KioskControls />
          </div>
        </>
      )}
    </header>
  );
}
