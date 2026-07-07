import type { UptimeMonitorDto } from '@types';
import { useMemo, useState } from 'react';
import { ChartPanel } from '../common/charts/ChartPanel';
import { EmptyState } from "../common/ui/EmptyState.tsx";
import { getTenantFaviconUrl } from '../../utils/tenantHelper';
import { getTagColor, getTagStyle } from '../../utils/tagHelper';

interface MonitorIssue {
  id: number;
  tenantId: string;
  tenantName: string;
  monitorName: string;
  uptime: number | null;
  isDown: boolean;
  isDegraded: boolean;
  isSlaBreach: boolean;
  latency: number | null;
  slaLimit?: number;
  degradedFloor?: number;
  url?: string | null;
  tags?: string[];
}

function formatPercent(val: number): string {
  // Safely truncate to 3-4 decimal places to prevent 99.9999% rounding up to 100.000%
  if (val < 100 && val >= 99.9995) {
    return (Math.floor(val * 10000) / 10000).toString();
  }
  return val.toFixed(3);
}

function buildIssues(
  monitors: UptimeMonitorDto[],
  defaultSla?: number | null,
  defaultDegradedFloor?: number | null
): MonitorIssue[] {
  const issues: MonitorIssue[] = [];

  monitors
    .filter((m) => m.uptimeMonitorEnabled)
    .forEach((m) => {
      const isDown = ['8', '9', 'DOWN', 'SEEMS DOWN', 'CRITICAL'].includes(m.currentStatus?.toString().toUpperCase().trim() || '');
      const degradedFloor = m.latencyDegradedFloor ?? defaultDegradedFloor;
      const isDegraded = degradedFloor !== null && degradedFloor !== undefined && m.currentLatency !== null && m.currentLatency > degradedFloor;

      let slaThreshold = m.uptimeSla ?? defaultSla;
      if (slaThreshold !== null && slaThreshold !== undefined && slaThreshold <= 1) {
        slaThreshold = slaThreshold * 100;
      }

      const uptime = m.currentUptimePercentage;
      const isSlaBreach = uptime !== null && uptime !== undefined && slaThreshold !== null && slaThreshold !== undefined && uptime < slaThreshold;

      if (!isDown && !isDegraded && !isSlaBreach) return;

      const tenantName = m.tenantName || m.name?.split('-')[0]?.trim() || 'Unknown';

      issues.push({
        id: m.id ?? 0,
        tenantId: m.tenantId || '',
        tenantName: tenantName,
        monitorName: m.name || '',
        uptime: uptime ?? null,
        latency: m.currentLatency ?? null,
        isDown,
        isDegraded,
        isSlaBreach,
        slaLimit: slaThreshold ?? undefined,
        degradedFloor: degradedFloor ?? undefined,
        url: m.url,
        tags: m.tags ?? undefined,
      });
    });

  return issues
    .sort((a, b) => {
      const weightA = (a.isDown ? 300 : 0) + (a.isSlaBreach ? 200 : 0) + (a.isDegraded ? 100 : 0);
      const weightB = (b.isDown ? 300 : 0) + (b.isSlaBreach ? 200 : 0) + (b.isDegraded ? 100 : 0);
      const uptimeA = a.uptime != null ? a.uptime : 100;
      const uptimeB = b.uptime != null ? b.uptime : 100;
      return weightB - weightA || uptimeA - uptimeB;
    });
}

export function SlaBreachWatchlist({
  isLoading,
  monitors,
  onClearSelection,
  defaultSla,
  defaultDegradedFloor,
  className = "flex-1 h-full min-h-[350px] contained:min-h-0 max-h-[600px] xl:max-h-none"
}: {
  isLoading?: boolean;
  monitors: UptimeMonitorDto[];
  onClearSelection?: () => void;
  defaultSla?: number | null;
  defaultDegradedFloor?: number | null;
  className?: string;
}) {
  const issues = useMemo(() => buildIssues(monitors, defaultSla, defaultDegradedFloor), [monitors, defaultSla, defaultDegradedFloor]);
  const [failedFavicons, setFailedFavicons] = useState<Set<number>>(new Set());

  return (
    <ChartPanel
      isLoading={isLoading}
      title="SLA Breach Watchlist"
      className={className}
      bodyClassName=""
      legend={
        <button
          onClick={onClearSelection}
          disabled={!onClearSelection}
          className={`bg-brand-bg-secondary text-white px-3 py-1 rounded-sm text-sm font-black uppercase tracking-widest hover:bg-brand-text transition-all shadow-sm cursor-pointer ${!onClearSelection ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
          Clear
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4 custom-scrollbar grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-2 gap-2 content-start">
        {issues.length === 0 ? (
          <div className="col-span-full h-full">
            <EmptyState message={"No issues detected"} variant={"minimal"} />
          </div>
        ) : (
          issues.map(issue => {
            const faviconUrl = issue.url ? getTenantFaviconUrl(issue.url) : null;
            const showFavicon = faviconUrl && !failedFavicons.has(issue.id);

            return (
              <div key={`watch-${issue.id}`} className="relative p-2 bg-slate-50 border border-slate-100 rounded-lg transition-all hover:border-slate-200 shadow-sm shrink-0 flex flex-col gap-0.5 justify-between">
                {showFavicon && (
                  <img
                    src={faviconUrl}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-16 opacity-20 pointer-events-none select-none"
                    onError={() => setFailedFavicons(prev => {
                      const next = new Set(prev);
                      next.add(issue.id);
                      return next;
                    })}
                    alt=""
                  />
                )}
                {/* Row 1: title + status badges */}
                <div className="flex justify-between items-start gap-2 relative z-10">
                  <div className="flex flex-col overflow-hidden min-w-0 flex-1 pr-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight truncate">{issue.tenantName}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{issue.monitorName}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end shrink-0">
                    {issue.isDown && <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">DOWN</span>}
                    {issue.isDegraded && !issue.isDown && <span className="bg-amber-500 text-white text-xs font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">DEGRADED</span>}
                    {issue.isSlaBreach && <span className="bg-slate-700 text-white text-xs font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">SLA BREACH</span>}
                  </div>
                </div>

                {/* Row 2: tags */}
                {issue.tags && issue.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 relative z-10">
                    {issue.tags.map((tag) => {
                      const name = tag.split(':')[0].trim();
                      const color = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border shadow-sm ${getTagStyle(color)}`}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Row 3: uptime + latency */}
                <div className="flex justify-between items-end relative z-10">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Uptime</span>
                    <span className={`text-base font-black ${issue.slaLimit && issue.uptime !== null && issue.uptime < issue.slaLimit ? 'text-red-600' : 'text-slate-900'}`}>
                      {issue.uptime !== null ? `${formatPercent(issue.uptime)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Latency</span>
                    <span className="text-base font-black text-slate-900">
                      {issue.isDown ? 'N/A' : `${Math.round(issue.latency ?? 0)}ms`}
                    </span>
                  </div>
                </div>

                {/* Row 4: SLA limit + degraded floor */}
                {(issue.slaLimit !== undefined && issue.slaLimit !== null || issue.degradedFloor !== undefined && issue.degradedFloor !== null) && (
                  <div className="pt-1 flex justify-between items-center gap-2 relative z-10">
                    {(issue.slaLimit !== undefined && issue.slaLimit !== null) ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">SLA Limit</span>
                        <span className="text-sm font-black text-slate-600 uppercase">{formatPercent(issue.slaLimit)}%</span>
                      </div>
                    ) : <div />}
                    {(issue.degradedFloor !== undefined && issue.degradedFloor !== null) ? (
                      <div className="flex flex-col items-end text-right">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Degraded</span>
                        <span className="text-sm font-black text-slate-600 uppercase">{issue.degradedFloor}ms</span>
                      </div>
                    ) : <div />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ChartPanel>
  );
}