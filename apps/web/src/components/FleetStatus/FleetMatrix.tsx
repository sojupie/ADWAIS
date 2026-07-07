import { useState } from 'react';
import type { UptimeMonitorDto } from '@types';
import { getMonitorStatus, STATUS_THEMES } from "../../utils/monitorStatusHelper.ts";
import { getTenantFaviconUrl } from "../../utils/tenantHelper.ts";
import { getTagColor, getTagStyle } from "../../utils/tagHelper.ts";

function FleetMatrixTile({
  monitor,
  isActive,
  selectedMonitorId,
  onMonitorSelect,
}: {
  monitor: UptimeMonitorDto;
  isActive: boolean;
  selectedMonitorId?: number | null;
  onMonitorSelect?: (monitor: UptimeMonitorDto) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const status = getMonitorStatus(monitor.currentStatus, monitor.currentLatency, monitor.latencyDegradedFloor);
  const tenantDisplay = monitor.tenantName || monitor.name.split('-')[0]?.trim() || 'Tenant';
  const theme = STATUS_THEMES[status];
  const faviconUrl = getTenantFaviconUrl(monitor.url);
  const showLetter = !faviconUrl || imgError;

  return (
    <button
      type="button"
      onClick={() => onMonitorSelect?.(monitor)}
      className={`w-full h-full p-3 rounded-lg border transition-all text-left relative overflow-hidden group min-h-22.5 shadow-sm
        ${theme.bg} ${theme.border}
        ${isActive ? 'ring-4 ring-slate-300/40 scale-[1.02] z-10' : 'hover:scale-[1.01] hover:shadow-md'}
        ${selectedMonitorId && !isActive ? 'opacity-30' : 'opacity-100'}
        ${!monitor.uptimeMonitorEnabled ? 'grayscale opacity-50' : ''}
      `}
    >
      <div className="absolute right-2 bottom-2  z-0 flex items-center justify-end pointer-events-none">
        {showLetter ? (
          <span className="text-5xl font-black text-slate-900 opacity-[0.2] select-none leading-none">
            {tenantDisplay.charAt(0).toUpperCase()}
          </span>
        ) : (
          <img
            src={faviconUrl!}
            alt=""
            className="w-12 h-12 object-contain opacity-[0.2]"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="gap-1 relative z-10 flex flex-col h-full justify-between w-full min-w-0">
        <div className="flex justify-between items-start w-full min-w-0">
          <div className="flex flex-col overflow-hidden min-w-0 flex-1 pr-2">
            <span className={`text-sm font-black ${theme.text} line-clamp-2 uppercase tracking-tight leading-tight`}>
              {tenantDisplay}
            </span>
            <span className={`text-xs font-bold ${theme.mutedText} uppercase tracking-wider mt-0.5 truncate`}>
              {monitor.name}
            </span>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${theme.dot}`} />
        </div>

        {monitor.tags && monitor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 w-full">
            {monitor.tags.map((tag) => {
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

        <div className="grid grid-cols-2 gap-x-2 mt-auto w-full">
          <div className="flex flex-col gap-0 min-w-0">
            <span className={`text-xs ${theme.mutedText} uppercase font-bold tracking-wider truncate`}>Uptime</span>
            <span className={`text-sm font-black ${theme.valueText} truncate`}>
              {monitor.currentUptimePercentage != null ? `${monitor.currentUptimePercentage.toFixed(2)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col gap-0 min-w-0">
            <span className={`text-xs ${theme.mutedText} uppercase font-bold tracking-wider truncate`}>Latency</span>
            <span className={`text-sm font-black ${theme.valueText} truncate`}>
              {(status === 'down' || status === 'unknown' || status === 'paused' || status === 'starting' || !Number(monitor.currentLatency)) ? 'N/A' : `${Math.round(Number(monitor.currentLatency))}ms`}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 portrait-lg:grid-cols-4 landscape-lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 pb-4">
      {monitors.map((monitor) => (
        <FleetMatrixTile
          key={`${monitor.tenantId}-${monitor.id}`}
          monitor={monitor}
          isActive={selectedMonitorId === monitor.id}
          selectedMonitorId={selectedMonitorId}
          onMonitorSelect={onMonitorSelect}
        />
      ))}
    </div>
  );
}
