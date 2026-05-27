import type { UptimeMonitorDto } from '@types';
import { ChartPanel } from '../common/ChartPanel';

interface MonitorIssue {
  id: number;
  tenantId: string;
  tenantName: string;
  monitorName: string;
  uptime: number;
  status: 'operational' | 'degraded' | 'down' | 'sla_breach';
  latency: number | null;
  slaLimit?: number;
  degradedFloor?: number;
}

function formatPercent(val: number): string {
  // Safely truncate to 3-4 decimal places to prevent 99.9999% rounding up to 100.000%
  if (val < 100 && val >= 99.9995) {
    return (Math.floor(val * 10000) / 10000).toString();
  }
  return val.toFixed(3);
}

function buildIssues(monitors: UptimeMonitorDto[]): MonitorIssue[] {
  const issues: MonitorIssue[] = [];

  monitors
    .filter((m) => m.uptimeMonitorEnabled)
    .forEach((m) => {
      const isDown = m.currentStatus.toUpperCase() === 'DOWN' || m.currentStatus.toUpperCase() === 'CRITICAL';
      const isDegraded = m.latencyDegradedFloor !== null && m.currentLatency !== null && m.currentLatency > m.latencyDegradedFloor;
      
      let slaThreshold = m.uptimeSla;
      if (slaThreshold !== null && slaThreshold <= 1) {
        slaThreshold = slaThreshold * 100;
      }
      
      const isSlaBreach = slaThreshold !== null && m.currentUptimePercentage < slaThreshold;
      
      if (!isDown && !isDegraded && !isSlaBreach) return;

      const tenantName = m.tenantName || m.name.split('-')[0]?.trim() || 'Unknown';

      let currentStatus: MonitorIssue['status'] = 'sla_breach';
      if (isDown) currentStatus = 'down';
      else if (isDegraded) currentStatus = 'degraded';

      issues.push({
        id: m.id,
        tenantId: m.tenantId,
        tenantName: tenantName,
        monitorName: m.name,
        uptime: m.currentUptimePercentage,
        latency: m.currentLatency,
        status: currentStatus,
        slaLimit: slaThreshold ?? undefined,
        degradedFloor: m.latencyDegradedFloor ?? undefined,
      });
    });

  return issues
    .sort((a, b) => {
       const statusWeight = { down: 0, degraded: 1, sla_breach: 2, operational: 3 };
       return statusWeight[a.status] - statusWeight[b.status] || a.uptime - b.uptime;
    });
}

export function SlaBreachWatchlist({ monitors, onClearSelection }: { monitors: UptimeMonitorDto[], onClearSelection?: () => void }) {
  const issues = buildIssues(monitors);

  return (
    <ChartPanel 
      title="SLA Breach Watchlist" 
      className="flex-1 min-h-0 h-full"
      bodyClassName="h-full flex flex-col min-h-0"
      legend={onClearSelection && (
        <button 
          onClick={onClearSelection}
          className="text-xs font-bold text-brand-primary hover:text-brand-heading uppercase tracking-widest transition-colors cursor-pointer"
        >
          Clear
        </button>
      )}
    >
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar grid grid-cols-1 xl:grid-cols-2 gap-2 content-start">
          {issues.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-full text-xs font-bold text-slate-400 uppercase tracking-widest">Zero active breaches</div>
          ) : (
            issues.map(issue => (
              <div key={`watch-${issue.id}`} className="p-2 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200 shadow-sm shrink-0 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none truncate">{issue.tenantName}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{issue.monitorName}</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest shrink-0 
                    ${issue.status === 'down' ? 'bg-red-500 text-white' : 
                      issue.status === 'degraded' ? 'bg-amber-500 text-white' : 
                      'bg-slate-700 text-white'}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uptime</span>
                    <span className={`text-base font-black ${issue.slaLimit && issue.uptime < issue.slaLimit ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatPercent(issue.uptime)}%
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Latency</span>
                    <span className="text-base font-black text-slate-900">
                      {issue.status === 'down' ? 'N/A' : `${Math.round(issue.latency ?? 0)}ms`}
                    </span>
                  </div>
                </div>
                {(issue.slaLimit || issue.degradedFloor) && (
                   <div className="mt-1 pt-1 border-t border-slate-100 flex justify-between items-center gap-2">
                      {issue.slaLimit ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SLA Limit</span>
                          <span className="text-[9px] font-black text-slate-600 uppercase">{formatPercent(issue.slaLimit)}%</span>
                        </div>
                      ) : <div />}
                      {issue.degradedFloor && (
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Degraded</span>
                          <span className="text-[9px] font-black text-slate-600 uppercase">{issue.degradedFloor}ms</span>
                        </div>
                      )}
                   </div>
                )}
              </div>
            ))
          )}
      </div>
    </ChartPanel>
  );
}