import { Bell, BellOff } from 'lucide-react';
import { useKiosk } from './KioskContext';

export function NotificationToggleWidget() {
  const { notificationsEnabled, toggleNotifications } = useKiosk();

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      className={`relative overflow-hidden flex items-center justify-between px-3.5 py-1.5 border rounded-lg gap-1 shadow-sm transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]
        ${notificationsEnabled 
          ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
          : 'bg-slate-200 border-slate-200 hover:bg-slate-100'
        }`}
      aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
      title={notificationsEnabled ? 'Mute new order notifications' : 'Unmute new order notifications'}
    >
      <div className="flex items-center">
        <span className={`text-sm font-bold tracking-wider transition-colors duration-500
            ${notificationsEnabled ? 'text-emerald-700' : 'text-slate-650'}`}>
          {notificationsEnabled ? 'ALERTS ON' : 'ALERTS OFF'}
        </span>
      </div>

      <div className={`flex items-center justify-center w-5 h-5 transition-colors duration-500 z-10
        ${notificationsEnabled ? 'text-emerald-700' : 'text-slate-650'}`}
      >
        {notificationsEnabled ? (
          <Bell size={14} fill="currentColor" />
        ) : (
          <BellOff size={14} fill="currentColor" />
        )}
      </div>
    </button>
  );
}
