import {ServerCrash, WifiOff} from 'lucide-react';

type ConnectivityStatusProps = {
  isOnline: boolean;
  isBackendOnline: boolean;
  variant: 'mobile' | 'desktop';
};

export function ConnectivityStatus({isOnline, isBackendOnline, variant}: ConnectivityStatusProps) {
  if (!isOnline) {
    return (
      <span
        className={variant === 'mobile'
          ? 'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-extrabold text-red-400 bg-red-950/40 border border-red-800/40 uppercase tracking-wider whitespace-nowrap shrink-0'
          : 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-red-600 bg-red-50 border border-red-200 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap shrink-0'}
        title="Application is offline"
      >
        <WifiOff size={variant === 'mobile' ? 12 : 14} className="animate-pulse" />
        <span>Offline</span>
      </span>
    );
  }

  if (!isBackendOnline) {
    return (
      <span
        className={variant === 'mobile'
          ? 'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-extrabold text-amber-400 bg-amber-950/40 border border-amber-800/40 uppercase tracking-wider whitespace-nowrap shrink-0'
          : 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-extrabold text-amber-600 bg-amber-50 border border-amber-200 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap shrink-0'}
        title="Backend server is unreachable"
      >
        <ServerCrash size={variant === 'mobile' ? 12 : 14} className="animate-pulse" />
        <span>{variant === 'mobile' ? 'Server' : 'Server Offline'}</span>
      </span>
    );
  }

  return null;
}
