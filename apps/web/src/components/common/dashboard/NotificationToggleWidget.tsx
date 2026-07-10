import { Bell, BellOff } from 'lucide-react';
import { useKiosk } from './KioskContext';

export function NotificationToggleWidget() {
  const { notificationsEnabled, toggleNotifications } = useKiosk();

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      className={`relative overflow-hidden flex items-center justify-between px-4 py-1.5 rounded-full gap-1 shadow-sm transition-all duration-300 border-none whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]
        ${notificationsEnabled 
          ? 'bg-status-up hover:bg-status-up/90 text-white' 
          : 'bg-brand-btn-primary hover:bg-brand-btn-primary/90 text-slate-300'
        }`}
      aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
      title={notificationsEnabled ? 'Mute new order notifications' : 'Unmute new order notifications'}
    >
      <div className="flex items-center w-[88px]">
        <span className="text-sm font-bold tracking-wider">
          {notificationsEnabled ? 'ALERTS ON' : 'ALERTS OFF'}
        </span>
      </div>

      <div className="flex items-center justify-center w-5 h-5 z-10">
        {notificationsEnabled ? (
          <Bell size={14} fill="currentColor" />
        ) : (
          <BellOff size={14} />
        )}
      </div>
    </button>
  );
}
