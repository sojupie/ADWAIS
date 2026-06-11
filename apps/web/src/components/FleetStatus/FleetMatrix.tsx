import type { UptimeMonitorDto } from '@types';
import {normalizeStatus} from "../../utils/monitorStatusHelper.ts";

const getTagColor = (tag: string) => {
  const parts = tag.split(':');
  if (parts.length > 1 && parts[1]) {
    return parts[1].toLowerCase();
  }
  const tagName = parts[0].trim().toUpperCase();
  const colors = ['blue', 'green', 'red', 'orange', 'yellow', 'purple'];
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getTagStyle = (color: string) => {
  switch (color?.toLowerCase()) {
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'green':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'red':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'orange':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'yellow':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'purple':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'grey':
    case 'slate':
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

function getMonitorStatus(monitor: UptimeMonitorDto): 'operational' | 'degraded' | 'down' | 'unknown' | 'paused' | 'starting' {
  const status = normalizeStatus(monitor.currentStatus);
  if (status === 'STARTING') return 'starting';
  if (status === 'DOWN' || status === 'CRITICAL') return 'down';
  if (status === 'PAUSED') return 'paused';
  if (status === 'UNKNOWN') return 'unknown';
  
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
            mutedText: 'text-slate-500',
            dot: 'bg-slate-400'
          },
          paused: {
            bg: 'bg-blue-50',
            border: 'border-slate-300',
            text: 'text-slate-500',
            valueText: 'text-slate-500',
            mutedText: 'text-slate-500',
            dot: 'bg-slate-400'
          },
          starting: {
            bg: 'bg-indigo-50/50',
            border: 'border-indigo-200',
            text: 'text-indigo-900',
            valueText: 'text-indigo-600',
            mutedText: 'text-indigo-500',
            dot: 'bg-indigo-400'
          }
        };

        const theme = statusThemes[status];

        return (
          <button
            key={`${monitor.tenantId}-${monitor.id}`}
            type="button"
            onClick={() => onMonitorSelect?.(monitor)}
            className={`flex flex-col p-3 rounded-lg border-2 transition-all text-left relative group min-h-22.5 shadow-sm
              ${theme.bg} ${theme.border}
              ${isActive ? 'ring-4 ring-slate-300/40 scale-[1.02] z-10' : 'hover:scale-[1.01] hover:shadow-md'}
              ${selectedMonitorId && !isActive ? 'opacity-30' : 'opacity-100'}
              ${!monitor.uptimeMonitorEnabled ? 'grayscale opacity-50' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-2 w-full">
              <div className="flex flex-col overflow-hidden pr-2 w-full">
                <span className={`text-sm font-black ${theme.text} truncate uppercase tracking-tight leading-tight`}>
                  {tenantDisplay}
                </span>
                <span className={`text-[9px] font-bold ${theme.mutedText} uppercase tracking-widest mt-0.5 truncate`}>
                  {monitor.name}
                </span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${theme.dot}`} />
            </div>

            {monitor.tags && monitor.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3 w-full">
                {monitor.tags.map((tag) => {
                  const name = tag.split(':')[0].trim();
                  const color = getTagColor(tag);
                  return (
                    <span 
                      key={tag} 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border shadow-sm ${getTagStyle(color)}`}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-x-2 mt-auto w-full">
              <div className="flex flex-col gap-0">
                <span className={`text-[9px] ${theme.mutedText} uppercase font-bold tracking-widest`}>Uptime</span>
                <span className={`text-base font-black ${theme.valueText}`}>
                  {monitor.currentUptimePercentage != null ? `${monitor.currentUptimePercentage.toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-0">
                <span className={`text-[9px] ${theme.mutedText} uppercase font-bold tracking-widest`}>Latency</span>
                <span className={`text-base font-black ${theme.valueText}`}>
                  {(status === 'down' || status === 'unknown' || status === 'paused' || status === 'starting' || !Number(monitor.currentLatency)) ? 'N/A' : `${Math.round(Number(monitor.currentLatency))}ms`}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
