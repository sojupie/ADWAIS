import { useEffect, useMemo, useRef, useState } from 'react';
import type { MonitorAvailabilityPointResponseDto } from '@types';

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-SE', {
    day: 'numeric',
    month: 'short',
  });
}

function formatRange(point: MonitorAvailabilityPointResponseDto) {
  const start = formatDate(point.date);
  const end = formatDate(point.endDate);
  return point.date === point.endDate ? start : `${start}–${end}`;
}

function formatUptime(value: number | null | undefined) {
  return value == null ? 'No data' : `${value.toFixed(3)}%`;
}

function pointColor(value: number | null | undefined, sla: number | null | undefined) {
  if (value == null) return 'bg-surface-container-high border-outline-variant';
  if (sla != null) {
    if (value < sla) return 'bg-status-down border-status-down';
    if (value < 99.95) return 'bg-status-degraded border-status-degraded';
    return 'bg-teal-500 border-teal-600';
  }
  // These are fixed visual availability bands, not a fallback SLA.
  if (value < 99.9) return 'bg-status-down border-status-down';
  if (value < 99.95) return 'bg-status-degraded border-status-degraded';
  return 'bg-teal-500 border-teal-600';
}

export function AvailabilityStrip({
  points,
  sla,
  aggregate = false,
}: {
  points: MonitorAvailabilityPointResponseDto[];
  sla?: number | null;
  aggregate?: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resetWhenClickingOutside = (event: PointerEvent) => {
      if (!stripRef.current?.contains(event.target as Node)) {
        setSelectedIndex(null);
      }
    };

    document.addEventListener('pointerdown', resetWhenClickingOutside);
    return () => document.removeEventListener('pointerdown', resetWhenClickingOutside);
  }, []);
  const latestPopulatedIndex = useMemo(() => {
    for (let index = points.length - 1; index >= 0; index -= 1) {
      if (points[index].uptimePercentage != null) return index;
    }
    return null;
  }, [points]);
  const activeIndex = selectedIndex ?? latestPopulatedIndex;
  const activePoint = activeIndex == null ? null : points[activeIndex];
  const gapClass = points.length > 45 ? 'gap-0.5' : 'gap-1';
  const radiusClass = points.length > 45 ? 'rounded-sm' : 'rounded-md';

  if (points.length === 0) {
    return <p className="text-md font-medium text-on-surface-variant">No availability data for this period.</p>;
  }

  return (
    <div
      ref={stripRef}
      className="flex flex-col gap-3 min-w-0"
      onMouseLeave={() => setSelectedIndex(null)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setSelectedIndex(null);
        }
      }}
    >
      <div className="min-w-0 pb-2">
        <div
          className={`grid min-w-0 w-full ${gapClass}`}
          style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          role="group"
          aria-label="Availability over time"
        >
          {points.map((point, index) => {
            const label = `${formatRange(point)}: ${formatUptime(point.uptimePercentage)}${point.isPartial ? ', partial period' : ''}`;
            return (
              <button
                key={`${point.date}-${point.endDate}`}
                type="button"
                aria-label={label}
                aria-pressed={activeIndex === index}
                onMouseEnter={() => setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
                onClick={() => setSelectedIndex(index)}
              className={`h-8 min-w-0 w-full ${radiusClass} border transition-all focus:outline-none focus:ring-2 focus:ring-brand-btn-primary focus:ring-offset-2 ${pointColor(point.uptimePercentage, sla)} ${point.isPartial ? 'opacity-70 border-dashed' : ''} ${activeIndex === index ? 'm3-elevation-2 -translate-y-0.5' : 'hover:-translate-y-0.5'}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 min-h-10 rounded-xl bg-surface-container px-3 py-2">
        {activePoint ? (
          <>
            <span className="font-bold text-md text-on-surface">
              {formatRange(activePoint)}{activePoint.isPartial ? ' · Partial period' : ''}
            </span>
            <span className="font-black text-xl text-on-surface">{formatUptime(activePoint.uptimePercentage)}</span>
            {aggregate && activePoint.monitorCount > 0 && (
              <span className="w-full text-md font-bold text-on-surface-variant">
                {activePoint.monitorCount} monitor{activePoint.monitorCount === 1 ? '' : 's'} · Worst {formatUptime(activePoint.lowestMonitorUptimePercentage)}
              </span>
            )}
          </>
        ) : (
          <span className="font-medium text-on-surface-variant">No samples in this period.</span>
        )}
      </div>
    </div>
  );
}
