import type { UptimeMonitorDto } from '@types';
import { useMemo, useState } from 'react';
import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { EmptyState } from "../common/ui/EmptyState.tsx";
import { getTenantFaviconUrl } from '../../utils/tenantHelper';
import { getTagColor, getTagStyle } from '../../utils/tagHelper';
import { STATUS_THEMES } from '../../utils/monitorStatusHelper';

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
  monitor: UptimeMonitorDto;
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
        monitor: m,
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
  defaultSla,
  defaultDegradedFloor,
  onMonitorSelect,
  selectedMonitorId,
  onClearSelection,
  hasActiveSelection,
  className = "flex-1 h-full min-h-[350px] contained:min-h-0 max-h-[600px] xl:max-h-none"
}: {
  isLoading?: boolean;
  monitors: UptimeMonitorDto[];
  defaultSla?: number | null;
  defaultDegradedFloor?: number | null;
  onMonitorSelect?: (monitor: UptimeMonitorDto) => void;
  selectedMonitorId?: number | null;
  onClearSelection?: () => void;
  hasActiveSelection?: boolean;
  className?: string;
}) {
  const issues = useMemo(() => buildIssues(monitors, defaultSla, defaultDegradedFloor), [monitors, defaultSla, defaultDegradedFloor]);
  const [failedFavicons, setFailedFavicons] = useState<Set<number>>(new Set());

  return (
    <CollectionPanel
      isLoading={isLoading}
      title="Endpoint Watchlist"
      className={className}
      titleClassName="!text-sm !md:text-md"
      actions={
        onClearSelection ? (
          <button
            type="button"
            onClick={onClearSelection}
            disabled={!hasActiveSelection}
            className="bg-surface-container-low hover:m3-elevation-2 m3-elevation-1 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all cursor-pointer disabled:m3-elevation-0 disabled:text-slate-400 disabled:bg-slate-200 disabled:cursor-not-allowed"
          >
            CLEAR
          </button>
        ) : undefined
      }
    >
      <div className="p-4 pt-1 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-2 gap-4 content-start">
        {issues.length === 0 ? (
          <div className="col-span-full h-full">
            <EmptyState message={"No issues detected"} variant={"minimal"} />
          </div>
        ) : (
          issues.map(issue => {
            const faviconUrl = issue.url ? getTenantFaviconUrl(issue.url) : null;
            const showFavicon = faviconUrl && !failedFavicons.has(issue.id);
            const status = issue.isDown ? 'down' : issue.isDegraded ? 'degraded' : 'operational';
            const theme = STATUS_THEMES[status];
            const isActive = selectedMonitorId === issue.id;

            return (
              <button
                type="button"
                key={`watch-${issue.id}`}
                onClick={() => onMonitorSelect?.(issue.monitor)}
                className={`relative p-2 rounded-lg transition-all text-left w-full h-full min-h-fit shrink-0 flex flex-col gap-1.5 justify-between border
                   ${theme.bg} ${theme.border} ${theme.text}
                  ${isActive ? 'z-10 m3-elevation-3' : 'm3-elevation-2 hover:m3-elevation-3 cursor-pointer'}
                  ${selectedMonitorId && !isActive ? 'opacity-30' : 'opacity-100'}
                `}
              >
                {showFavicon && (
                  <img
                    src={faviconUrl}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-16 opacity-20 pointer-events-none select-none mix-blend-multiply"
                    onError={() => setFailedFavicons(prev => {
                      const next = new Set(prev);
                      next.add(issue.id);
                      return next;
                    })}
                    alt=""
                  />
                )}
                {/* Row 1: title + status badges */}
                <div className="flex flex-wrap justify-between items-start gap-1 relative z-10">
                  <div className="flex flex-col overflow-hidden min-w-0 flex-1 pr-2 min-w-[calc(50%)]">
                    <span className={`text-sm font-black uppercase tracking-tight leading-tight truncate ${theme.text}`}>{issue.tenantName}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest mt-0.5 truncate ${theme.mutedText}`}>{issue.monitorName}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end shrink-0">
                    {issue.isDown && <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">DOWN</span>}
                    {issue.isDegraded && !issue.isDown && <span className="bg-amber-500 text-white text-xs font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">DEGRADED</span>}
                    {issue.isSlaBreach && <span className="bg-slate-700 text-white text-xs font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-widest shrink-0">SLA BREACH</span>}
                  </div>
                </div>

                {/* Row 2: tags */}
                {issue.tags && issue.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {issue.tags.map((tag) => {
                      const name = tag.split(':')[0].trim();
                      const color = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${getTagStyle(color)}`}
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
                    <span className={`text-sm font-bold uppercase tracking-widest ${theme.mutedText}`}>Uptime</span>
                    <span className={`text-base font-black ${
                      issue.isDown
                        ? 'text-red-600'
                        : (issue.slaLimit && issue.uptime !== null && issue.uptime < issue.slaLimit)
                          ? 'text-red-600'
                          : 'text-on-surface'
                    }`}>
                      {issue.uptime !== null ? `${formatPercent(issue.uptime)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold uppercase tracking-widest ${theme.mutedText}`}>Latency</span>
                    <span className={`text-base font-black ${
                      issue.isDown
                        ? 'text-on-surface-variant'
                        : issue.isDegraded
                          ? 'text-amber-600'
                          : 'text-on-surface'
                    }`}>
                      {issue.isDown ? 'N/A' : `${Math.round(issue.latency ?? 0)}ms`}
                    </span>
                  </div>
                </div>

                {/* Row 4: SLA limit + degraded floor */}
                {(issue.slaLimit !== undefined && issue.slaLimit !== null || issue.degradedFloor !== undefined && issue.degradedFloor !== null) && (
                  <div className="pt-1 flex justify-between items-center gap-4 relative z-10">
                    {(issue.slaLimit !== undefined && issue.slaLimit !== null) ? (
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold uppercase tracking-widest ${theme.mutedText}`}>SLA</span>
                        <span className={`text-sm font-black uppercase ${theme.mutedText}`}>{formatPercent(issue.slaLimit)}%</span>
                      </div>
                    ) : <div />}
                    {(issue.degradedFloor !== undefined && issue.degradedFloor !== null) ? (
                      <div className="flex flex-col items-end text-right">
                        <span className={`text-sm font-bold uppercase tracking-widest ${theme.mutedText}`}>THRESHOLD</span>
                        <span className={`text-sm font-black uppercase ${theme.mutedText}`}>{issue.degradedFloor}ms</span>
                      </div>
                    ) : <div />}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </CollectionPanel>
  );
}
