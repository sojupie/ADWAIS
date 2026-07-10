import { X, Settings, Link, RefreshCw, ShieldAlert } from 'lucide-react';

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isWriter: boolean;
  token?: string;
  isTokenRequested: boolean;
  onGenerateToken: () => void;
  onCopyFeedLink: () => void;
  onRegenerateToken: () => void;
}

export function CalendarSettingsModal({
  isOpen,
  onClose,
  isWriter,
  token,
  isTokenRequested,
  onGenerateToken,
  onCopyFeedLink,
  onRegenerateToken,
}: CalendarSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface rounded-3xl shadow-2xl border-0 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 max-h-[90vh]">
        <div className="flex justify-between items-center bg-surface px-6 py-5 pb-2">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Settings size={20} className="text-on-surface-variant animate-spin-slow" /> Calendar Settings
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface-variant cursor-pointer p-1 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 pt-2 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Personal ICS Subscription Feed */}
          <div className="flex flex-col gap-3">
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2 pl-1">
              <Link size={18} className="text-on-surface-variant" /> Subscribe to feed in Outlook / Google
            </h4>
            <p className="text-sm text-on-surface-variant leading-normal">
              Subscribe to this calendar inside external clients using your personal read-only feed. This syncs all company calendar events automatically. Keep this token private.
            </p>
            <p className="text-sm text-on-surface-variant leading-normal">
              To add a feed to the shared ADWAIS calendar, go to Settings {">"} Configuration
            </p>
            {isWriter ? (
              token ? (
                <div className="flex gap-2 animate-in fade-in duration-200">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/api/intranet/calendar/feed.ics?token=${token}`}
                    className="flex-1 bg-surface-container border-0 text-on-surface-variant text-sm px-4 py-3 rounded-2xl focus:outline-none select-all truncate" 
                  />
                  <button 
                    onClick={onCopyFeedLink}
                    className="bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white text-sm font-bold px-5 py-3 rounded-full transition shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                  <button 
                    onClick={onRegenerateToken}
                    className="p-3 text-on-surface-variant hover:text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-full transition cursor-pointer flex items-center justify-center"
                    title="Regenerate Token"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              ) : isTokenRequested ? (
                <div className="text-sm text-on-surface-variant italic flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Generating feed token...
                </div>
              ) : (
                <button
                  onClick={onGenerateToken}
                  className="w-full bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white text-sm font-bold px-5 py-3 rounded-full transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  Generate Feed Link
                </button>
              )
            ) : (
              <div className="flex flex-col gap-4 mt-2">
                <button
                  disabled
                  className="w-full bg-surface-container border-0 text-on-surface-variant text-sm font-bold px-5 py-3 rounded-full transition shadow-sm opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Generate Feed Link (Access Restricted)
                </button>
                <div className="flex gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm leading-normal font-medium">
                  <ShieldAlert size={20} className="text-red-650 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Access Denied:</span> You are not a configured user with a registered intranet identity or required role (Employee/Admin). Feed subscription generation is disabled.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
