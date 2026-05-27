import type { UptimeMonitorDto } from '@types';

function normalizeStatus(status?: string | number): string {
  const s = status?.toString() ?? 'Unknown';
  if (s === '2') return 'UP';
  if (s === '8' || s === '9') return 'DOWN';
  if (s === '0') return 'PAUSED';
  if (s === '1' || !s) return 'UNKNOWN';
  return s.toUpperCase().trim();
}

function getMonitorStatus(monitor: UptimeMonitorDto): 'operational' | 'degraded' | 'down' | 'unknown' {
  const status = normalizeStatus(monitor.currentStatus);
  if (status === 'DOWN' || status === 'CRITICAL') return 'down';
  if (status === 'UNKNOWN' || status === 'PAUSED') return 'unknown';
  
  if (monitor.currentLatency && monitor.latencyDegradedFloor && monitor.currentLatency > monitor.latencyDegradedFloor) {
    return 'degraded';
  }
  
  return 'operational';
}

export function FleetMatrix({ 
  monitors, 
  onMonitorSelect,
  selectedMonitorId 
}: { 
  monitors: UptimeMonitorDto[], 
  onMonitorSelect?: (monitor: UptimeMonitorDto) => void,
  selectedMonitorId?: number | null
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {monitors.map((monitor) => {
        const status = getMonitorStatus(monitor);
        const isActive = selectedMonitorId === monitor.id;
        const tenantDisplay = monitor.tenantName || monitor.name.split('-')[0]?.trim() || "Tenant";

        const statusThemes = {
          down: { 
            bg: 'bg-red-50', 
            border: 'border-red-200', 
            text: 'text-slate-900',
            valueText: 'text-red-600',
            mutedText: 'text-slate-500',
            dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
          },
          degraded: { 
            bg: 'bg-amber-50', 
            border: 'border-amber-200', 
            text: 'text-slate-900',
            valueText: 'text-amber-600',
            mutedText: 'text-slate-500',
            dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
          },
          operational: { 
            bg: 'bg-white', 
            border: 'border-slate-200', 
            text: 'text-slate-900',
            valueText: 'text-slate-900',
            mutedText: 'text-slate-500',
            dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
          },
          unknown: { 
            bg: 'bg-slate-100', 
            border: 'border-slate-300', 
            text: 'text-slate-500',
            valueText: 'text-slate-500',
            mutedText: 'text-slate-400',
            dot: 'bg-slate-400'
          }
        };

        const theme = statusThemes[status];

        return (
          <button
            key={`${monitor.tenantId}-${monitor.id}`}
            type="button"
            onClick={() => onMonitorSelect?.(monitor)}
            className={`flex flex-col p-3 rounded-lg border-2 transition-all text-left relative group min-h-[90px] shadow-sm
              ${theme.bg} ${theme.border}
              ${isActive ? 'ring-4 ring-slate-300/40 scale-[1.02] z-10' : 'hover:scale-[1.01] hover:shadow-md'}
              ${selectedMonitorId && !isActive ? 'opacity-30' : 'opacity-100'}
              ${!monitor.uptimeMonitorEnabled ? 'grayscale opacity-50' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col overflow-hidden pr-2">
                <span className={`text-sm font-black ${theme.text} truncate uppercase tracking-tight leading-tight`}>
                  {tenantDisplay}
                </span>
                <span className={`text-[9px] font-bold ${theme.mutedText} uppercase tracking-widest mt-0.5 truncate`}>
                  {monitor.name}
                </span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${theme.dot}`} />
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 mt-auto">
              <div className="flex flex-col gap-0">
                <span className={`text-[9px] ${theme.mutedText} uppercase font-bold tracking-widest`}>Uptime</span>
                <span className={`text-base font-black ${theme.valueText}`}>
                  {monitor.currentUptimePercentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col gap-0">
                <span className={`text-[9px] ${theme.mutedText} uppercase font-bold tracking-widest`}>Latency</span>
                <span className={`text-base font-black ${theme.valueText}`}>
                  {(status === 'down' || status === 'unknown' || monitor.currentLatency === 0) ? 'N/A' : `${Math.round(monitor.currentLatency ?? 0)}ms`}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
