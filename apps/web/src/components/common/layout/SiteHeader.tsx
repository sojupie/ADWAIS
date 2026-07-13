import {Menu, Settings, X} from 'lucide-react';
import type {Timeframe} from '../../../schemas';
import {KioskControls} from '../dashboard/KioskControls';
import {NotificationToggleWidget} from '../dashboard/NotificationToggleWidget';
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
  isProgressBarVisible: boolean;
};

export function SiteHeader({
  financialTimeframe,
  fleetTimeframe,
  isMobileMenuOpen,
  isOnline,
  isBackendOnline,
  userLabel,
  onToggleMobileMenu,
  isProgressBarVisible,
}: SiteHeaderProps) {
  const isMobileView = useMediaQuery('(max-width: 767px)');

  return (
    <header className="site-header relative shrink-0 bg-brand-bg-secondary shadow-sm z-10 px-6 py-3">
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
              className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-surface/10 transition-colors"
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
            <NotificationToggleWidget />
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
            className="absolute bottom-0 left-0 right-0 h-[6px] translate-y-full z-50 overflow-hidden bg-primary-container pointer-events-none transition-opacity duration-500"
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
        </>
      )}
    </header>
  );
}
