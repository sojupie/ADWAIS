import {Link} from '@tanstack/react-router';
import {Settings, X} from 'lucide-react';
import type {Timeframe} from '../../../schemas';
import {MotilloLogoLink} from './MotilloLogoLink';
import {NotificationToggleWidget} from '../dashboard/NotificationToggleWidget';
import {UserAccountLink} from './UserAccountLink';

type MobileNavigationMenuProps = {
  pathname: string;
  financialTimeframe: Timeframe;
  fleetTimeframe: Timeframe;
  onClose: () => void;
  userLabel: string | null;
};

const mobileLinkClass = (isActive: boolean, extra = '') =>
  `px-6 py-3 rounded-full text-base font-bold transition-colors ${extra} ${
    isActive
      ? 'bg-brand-accent/20 text-brand-accent'
      : 'text-white/80 hover:bg-surface/5 hover:text-white'
  }`;

export function MobileNavigationMenu({pathname, financialTimeframe, fleetTimeframe, onClose, userLabel}: MobileNavigationMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg-secondary" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant shrink-0">
        <MotilloLogoLink
          timeframe={financialTimeframe}
          className="h-7 w-auto object-contain object-left brightness-0 invert"
          height={28}
          onClick={onClose}
        />
        <div className="flex items-center gap-2">
          <UserAccountLink label={userLabel} variant="mobile" />
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-surface/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-brand-bg-secondary custom-scrollbar px-5 py-6 flex flex-col gap-8">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          <span className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 px-3">Navigation</span>
          <Link
            to="/financial"
            search={{timeframe: financialTimeframe}}
            onClick={onClose}
            className={mobileLinkClass(pathname === '/financial')}
            aria-current={pathname === '/financial' ? 'page' : undefined}
          >
            Financial
          </Link>
          <Link
            to="/fleet-status"
            search={{timeframe: fleetTimeframe}}
            onClick={onClose}
            className={mobileLinkClass(pathname.startsWith('/fleet-status'))}
            aria-current={pathname.startsWith('/fleet-status') ? 'page' : undefined}
          >
            Fleet Status
          </Link>
          <Link
            to="/intranet"
            onClick={onClose}
            className={mobileLinkClass(pathname === '/intranet')}
            aria-current={pathname === '/intranet' ? 'page' : undefined}
          >
            Intranet
          </Link>
          <Link
            to="/settings"
            onClick={onClose}
            className={mobileLinkClass(pathname.startsWith('/settings'), 'flex items-center gap-2')}
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          >
            <Settings size={18} />
            Settings
          </Link>
        </nav>
        <nav className="flex flex-col gap-1" aria-label="Controls">
          <span className="text-xs font-black text-white/40 uppercase tracking-widest mt-4 mb-2 px-3">Controls</span>
          <div className="px-3">
            <NotificationToggleWidget />
          </div>
        </nav>
      </div>
    </div>
  );
}
