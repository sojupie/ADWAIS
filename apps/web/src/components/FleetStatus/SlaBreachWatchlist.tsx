import type { UptimeMonitorDto } from '@types';
import { useMemo } from 'react';
import { ChartPanel } from '../common/charts/ChartPanel';
import {EmptyState} from "../common/ui/EmptyState.tsx";

interface MonitorIssue {
  id: number;
  tenantId: string;
  tenantName: string;
  monitorName: string;
  uptime: number;
  isDown: boolean;
  isDegraded: boolean;
  isSlaBreach: boolean;
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
      const isDown = ['8', '9', 'DOWN', 'SEEMS DOWN', 'CRITICAL'].includes(m.currentStatus?.toString().toUpperCase().trim() || '');
      const isDegraded = m.latencyDegradedFloor !== null && m.currentLatency !== null && m.currentLatency > m.latencyDegradedFloor;
      
      let slaThreshold = m.uptimeSla;
      if (slaThreshold !== null && slaThreshold <= 1) {
        slaThreshold = slaThreshold * 100;
      }
      
      const isSlaBreach = slaThreshold !== null && m.currentUptimePercentage < slaThreshold;
      
      if (!isDown && !isDegraded && !isSlaBreach) return;

      const tenantName = m.tenantName || m.name.split('-')[0]?.trim() || 'Unknown';

      issues.push({
        id: m.id,
        tenantId: m.tenantId,
        tenantName: tenantName,
        monitorName: m.name,
        uptime: m.currentUptimePercentage,
        latency: m.currentLatency,
        isDown,
        isDegraded,
        isSlaBreach,
        slaLimit: slaThreshold ?? undefined,
        degradedFloor: m.latencyDegradedFloor ?? undefined,
      });
    });

  return issues
    .sort((a, b) => {
       const weightA = (a.isDown ? 300 : 0) + (a.isSlaBreach ? 200 : 0) + (a.isDegraded ? 100 : 0);
       const weightB = (b.isDown ? 300 : 0) + (b.isSlaBreach ? 200 : 0) + (b.isDegraded ? 100 : 0);
       return weightB - weightA || a.uptime - b.uptime;
    });
}

export function SlaBreachWatchlist({ isLoading, monitors, onClearSelection }: { isLoading?: boolean; monitors: UptimeMonitorDto[], onClearSelection?: () => void }) {
  const issues = useMemo(() => buildIssues(monitors), [monitors]);

  return (
    <ChartPanel 
      isLoading={isLoading}
      title="SLA Breach Watchlist" 
      className="flex-1 min-h-0 h-full max-h-[600px] xl:max-h-none"
      bodyClassName="h-full flex flex-col min-h-0"
      legend={
        <button 
          onClick={onClearSelection}
          disabled={!onClearSelection}
          className={`bg-brand-bg-secondary text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-brand-text transition-all shadow-sm cursor-pointer ${
            !onClearSelection ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          Clear
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-2 content-start">
          {issues.length === 0 ? (
            <div className="col-span-full h-full">
                <EmptyState message={"No issues detected"} variant={"minimal"}/>
            </div>
          ) : (
            issues.map(issue => (
              <div key={`watch-${issue.id}`} className="p-2 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200 shadow-sm shrink-0 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none truncate">{issue.tenantName}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{issue.monitorName}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end pl-2">
                    {issue.isDown && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">DOWN</span>}
                    {issue.isDegraded && !issue.isDown && <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">DEGRADED</span>}
                    {issue.isSlaBreach && <span className="bg-slate-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">SLA BREACH</span>}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Uptime</span>
                    <span className={`text-base font-black ${issue.slaLimit && issue.uptime < issue.slaLimit ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatPercent(issue.uptime)}%
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Latency</span>
                    <span className="text-base font-black text-slate-900">
                      {issue.isDown ? 'N/A' : `${Math.round(issue.latency ?? 0)}ms`}
                    </span>
                  </div>
                </div>
                {(issue.slaLimit || issue.degradedFloor) && (
                   <div className="mt-1 pt-1 border-t border-slate-100 flex justify-between items-center gap-2">
                      {issue.slaLimit ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SLA Limit</span>
                          <span className="text-[9px] font-black text-slate-600 uppercase">{formatPercent(issue.slaLimit)}%</span>
                        </div>
                      ) : <div />}
                      {issue.degradedFloor && (
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Degraded</span>
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