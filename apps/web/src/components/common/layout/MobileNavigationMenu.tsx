import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ChevronRight, Settings } from 'lucide-react';
import type { Timeframe } from '../../../schemas';
import { NotificationToggleWidget } from '../dashboard/NotificationToggleWidget';

type MobileNavigationMenuProps = {
  isOpen: boolean;
  pathname: string;
  financialTimeframe: Timeframe;
  fleetTimeframe: Timeframe;
  onClose: () => void;
};

const mobileLinkClass = (isActive: boolean, extra = '') =>
  `flex min-h-12 w-full items-center rounded-full px-5 text-left text-base font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${extra} ${
    isActive
      ? 'bg-brand-accent text-brand-text'
      : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;

export function MobileNavigationMenu({ isOpen, pathname, financialTimeframe, fleetTimeframe, onClose }: MobileNavigationMenuProps) {
  const [view, setView] = useState<'main' | 'settings'>(() =>
    pathname.startsWith('/settings') ? 'settings' : 'main',
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 top-[60px] z-40 xl:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      id="mobile-menu"
      role="dialog"
      aria-modal={isOpen ? true : undefined}
      aria-hidden={!isOpen}
      aria-label={view === 'settings' ? 'Settings navigation' : 'Main navigation'}
    >
      <button
        type="button"
        className={`absolute inset-0 cursor-default bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        inert={!isOpen}
        className={`m3-elevation-3 relative ml-auto flex h-full w-[320px] max-w-[calc(100vw-24px)] flex-col overflow-hidden bg-brand-bg-secondary text-white transition-transform ${isOpen ? 'translate-x-0 duration-[400ms] ease-[cubic-bezier(0.05,0.7,0.1,1)]' : 'translate-x-full duration-200 ease-[cubic-bezier(0.3,0,0.8,0.15)]'}`}
      >
        {view === 'settings' && (
          <div className="px-3 pb-2 pt-2">
            <button
              type="button"
              onClick={() => setView('main')}
              className="flex min-h-12 w-full items-center gap-4 rounded-full bg-white/10 px-4 text-left text-base font-black transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
            >
              <ArrowLeft size={22} aria-hidden="true" />
              Main menu
            </button>
          </div>
        )}

        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 custom-scrollbar ${view === 'main' ? 'pt-3' : ''}`}>
          {view === 'main' ? (
            <nav className="flex flex-col gap-2" aria-label="Main navigation links">
              <Link to="/financial" search={{ timeframe: financialTimeframe }} onClick={onClose} className={mobileLinkClass(pathname === '/financial')} aria-current={pathname === '/financial' ? 'page' : undefined}>Financial</Link>
              <Link to="/fleet-status" search={{ timeframe: fleetTimeframe }} onClick={onClose} className={mobileLinkClass(pathname.startsWith('/fleet-status'))} aria-current={pathname.startsWith('/fleet-status') ? 'page' : undefined}>Fleet Status</Link>
              <Link to="/intranet" onClick={onClose} className={mobileLinkClass(pathname === '/intranet')} aria-current={pathname === '/intranet' ? 'page' : undefined}>Intranet</Link>
              <button type="button" onClick={() => setView('settings')} className={mobileLinkClass(pathname.startsWith('/settings'), 'justify-between gap-3')}>
                <span className="flex items-center gap-4"><Settings size={19} aria-hidden="true" />Settings</span>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </nav>
          ) : (
            <nav className="flex flex-col gap-2" aria-label="Settings navigation links">
              <Link to="/settings/jobs" onClick={onClose} className={mobileLinkClass(pathname === '/settings/jobs', 'gap-3')} aria-current={pathname === '/settings/jobs' ? 'page' : undefined}>Background Jobs</Link>
              <Link to="/settings/configuration" onClick={onClose} className={mobileLinkClass(pathname === '/settings/configuration')}>Configuration</Link>
              <Link to="/settings/tenants" onClick={onClose} className={mobileLinkClass(pathname === '/settings/tenants')}>Tenants &amp; Monitors</Link>
              <Link to="/settings/events" onClick={onClose} className={mobileLinkClass(pathname === '/settings/events')}>Events &amp; Health</Link>
              <Link to="/settings/users" onClick={onClose} className={mobileLinkClass(pathname === '/settings/users')}>Users</Link>
              <Link to="/settings/authentication" onClick={onClose} className={mobileLinkClass(pathname === '/settings/authentication')}>Authentication</Link>
            </nav>
          )}

          <div className="mt-auto border-t border-white/15 px-2 pt-4">
            <span className="mb-3 block px-2 text-xs font-black uppercase tracking-widest text-white/50">Controls</span>
            <NotificationToggleWidget />
          </div>
        </div>
      </aside>
    </div>
  );
}
