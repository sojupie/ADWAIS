import { useEffect, useMemo, useRef, useState, Fragment, memo } from 'react';
import { createPortal } from 'react-dom';
import type { TransactionDensityResponse } from '@types';
import { formatCurrency, formatNumber } from '@utils';
import { formatDateTime } from '../../utils/dateTime';
import { ChartPanel } from '../common/charts/ChartPanel';
import {EmptyState} from "../common/ui/EmptyState.tsx";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TOOLTIP_WIDTH = 208;
const TOOLTIP_ESTIMATED_HEIGHT = 150;
const TOOLTIP_VIEWPORT_MARGIN = 8;
const TOOLTIP_OFFSET = 10;

// High contrast palette from yellow > purple > black
const PALETTE = [
  '#000004', '#1b0c42', '#4b0c6b', '#781c6d', 
  '#a52c60', '#cf4446', '#ed6925', '#fb9b06', 
  '#f7d03c', '#fcffa4'
];

const getColor = (value: number, min: number, max: number) => {
  if (max === min) return PALETTE[0];
  const normalized = (value - min) / (max - min);
  const index = Math.min(Math.floor(normalized * PALETTE.length), PALETTE.length - 1);
  return PALETTE[index];
};

export const TransactionDensityChart = memo(function TransactionDensityChart({
  isLoading, isStale, response,
  className }: { isLoading?: boolean; isStale?: boolean;
  response: TransactionDensityResponse;
  className?: string;
}) {
  const [hoverInfo, setHoverInfo] = useState<{
    day: number;
    hour: number;
    count: number;
    revenue: number;
    x: number;
    y: number;
    placement: 'left' | 'right' | 'center';
    pinned: boolean;
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hoverInfo?.pinned) return;

    const dismissOutsideTile = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-density-cell]')) return;
      setHoverInfo(null);
    };
    const dismissWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHoverInfo(null);
    };

    document.addEventListener('pointerdown', dismissOutsideTile, true);
    document.addEventListener('keydown', dismissWithEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutsideTile, true);
      document.removeEventListener('keydown', dismissWithEscape);
    };
  }, [hoverInfo?.pinned]);

  const { points, totalCount, minCount, maxCount, periodStart, periodEnd } = response;
  const isEmpty = points.length === 0;
  const periodLabel = `${formatDateTime(periodStart, { day: 'numeric', month: 'short' })}–${formatDateTime(periodEnd, { day: 'numeric', month: 'short' })}`;
  const matrix = useMemo(() => {
    const nextMatrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ count: 0, totalRevenue: 0 })));

    points.forEach(p => {
      const dayIndex = p.dayOfWeek - 1;
      if (dayIndex >= 0 && dayIndex <= 6 && p.hour >= 0 && p.hour <= 23) {
        nextMatrix[dayIndex][p.hour] = { count: p.count, totalRevenue: p.totalRevenue };
      }
    });

    return nextMatrix;
  }, [points]);

  const getTooltipInfo = (
    element: HTMLElement,
    day: number,
    hour: number,
    count: number,
    revenue: number,
    pinned: boolean,
  ) => {
    const rect = element.getBoundingClientRect();
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    const visibleLeft = Math.max(viewportRect?.left ?? 0, TOOLTIP_VIEWPORT_MARGIN);
    const visibleRight = Math.min(viewportRect?.right ?? window.innerWidth, window.innerWidth - TOOLTIP_VIEWPORT_MARGIN);
    const visibleMidpoint = (visibleLeft + visibleRight) / 2;
    const preferredPlacement = rect.left + rect.width / 2 < visibleMidpoint ? 'right' : 'left';
    const fitsRight = visibleRight - rect.right >= TOOLTIP_WIDTH + TOOLTIP_OFFSET;
    const fitsLeft = rect.left - visibleLeft >= TOOLTIP_WIDTH + TOOLTIP_OFFSET;
    const placement = preferredPlacement === 'right'
      ? (fitsRight ? 'right' : fitsLeft ? 'left' : 'center')
      : (fitsLeft ? 'left' : fitsRight ? 'right' : 'center');
    const halfTooltipHeight = TOOLTIP_ESTIMATED_HEIGHT / 2;

    return {
      day,
      hour,
      count,
      revenue,
      x: placement === 'right'
        ? rect.right + TOOLTIP_OFFSET
        : placement === 'left'
          ? rect.left - TOOLTIP_OFFSET
          : visibleMidpoint,
      y: Math.min(
        Math.max(rect.top + rect.height / 2, TOOLTIP_VIEWPORT_MARGIN + halfTooltipHeight),
        window.innerHeight - TOOLTIP_VIEWPORT_MARGIN - halfTooltipHeight,
      ),
      placement,
      pinned,
    } as const;
  };

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Transaction Density Matrix"
      subtitle={periodLabel}
      className={className || "h-full relative"}
      bodyClassName={isEmpty ? 'flex items-center h-full justify-center' : 'flex-1 min-h-0 flex flex-col p-4'}
      legend={
      <div className="flex flex-wrap items-end justify-end items-center gap-4">
        <div className="text-right leading-none border-r border-r border-outline pr-4">
          <strong className="block text-2xl font-black tabular-nums text-on-surface">{formatNumber(totalCount)}</strong>
          <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">transactions</span>
        </div>
        <div className="w-36 min-w-28" aria-label={`Density ranges from ${minCount} to ${maxCount} transactions per bucket`}>
          <div className="mb-1 flex justify-between text-md font-bold tabular-nums text-on-surface-variant">
            <span>{formatNumber(minCount)}</span>
            <span>{formatNumber(maxCount)}</span>
          </div>
          <div
            className="h-5 rounded-md"
            style={{ background: `linear-gradient(to right, ${PALETTE.join(', ')})` }}
          />
        </div>
      </div>}
    >
      {isEmpty ? (
        <EmptyState message={"No data available"} variant={"minimal"}/>
      ) : (
        <div ref={viewportRef} onScroll={() => setHoverInfo(null)} className="flex-1 flex flex-col h-full w-full relative overflow-x-auto custom-scrollbar">
          
          <div className="flex-1 grid grid-cols-[40px_repeat(24,_1fr)] min-w-[600px] lg:min-w-0 pb-2">
            {/* Header row for Hours */}
            <div className="col-span-1"></div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-center text-xs lg:text-sm text-on-surface-variant font-bold self-end pb-1">
                {h.toString().padStart(2, '0')}
              </div>
            ))}

            {/* Matrix rows */}
            {DAYS.map((day, dayIndex) => (
              <Fragment key={day}>
                {/* Day Label */}
                <div className="flex items-center justify-end pr-2 text-sm text-on-surface-variant font-bold">
                  {day}
                </div>
                {/* 24 Hour Cells for the Day */}
                {Array.from({ length: 24 }).map((_, hourIndex) => {
                  const cellData = matrix[dayIndex][hourIndex];
                  const color = cellData.count > 0 ? getColor(cellData.count, minCount, maxCount) : '#f8fafc'; // empty cells get faint background
                  
                  return (
                    <div
                      key={hourIndex}
                      data-density-cell
                      className="w-full h-full min-h-[20px] transition-opacity cursor-pointer hover:opacity-80 hover:ring-1 ring-slate-400"
                      style={{ backgroundColor: color }}
                      onMouseEnter={(e) => {
                        const info = getTooltipInfo(e.currentTarget, dayIndex, hourIndex, cellData.count, cellData.totalRevenue || 0, false);
                        setHoverInfo(current => current?.pinned ? current : info);
                      }}
                      onMouseLeave={() => setHoverInfo(current => current?.pinned ? current : null)}
                      onClick={(e) => {
                        const info = getTooltipInfo(e.currentTarget, dayIndex, hourIndex, cellData.count, cellData.totalRevenue || 0, true);
                        setHoverInfo(current => current?.pinned && current.day === dayIndex && current.hour === hourIndex ? null : info);
                      }}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          {/* Custom Tooltip */}
          {hoverInfo && createPortal(
            <div 
              className={`fixed z-50 w-52 max-w-[calc(100vw-16px)] -translate-y-1/2 rounded-lg border border-outline-variant bg-surface p-4 text-sm shadow-lg pointer-events-none ${hoverInfo.placement === 'left' ? '-translate-x-full' : hoverInfo.placement === 'center' ? '-translate-x-1/2' : ''}`}
              style={{ left: hoverInfo.x, top: hoverInfo.y }}
            >
              <p className="font-bold text-on-surface mb-3 border-b border-slate-50 pb-2">
                {DAYS[hoverInfo.day]} at {hoverInfo.hour.toString().padStart(2, '0')}:00
              </p>
              <div className="space-y-2">
                <p className="flex min-w-0 justify-between gap-4">
                  <span className="text-on-surface-variant">Transactions:</span>
                  <strong className="shrink-0 text-on-surface-variant">{hoverInfo.count}</strong>
                </p>
                <p className="flex min-w-0 justify-between gap-4">
                  <span className="text-on-surface-variant">Revenue:</span>
                  <strong className="shrink-0 text-right text-on-surface-variant">{formatCurrency(hoverInfo.revenue)}</strong>
                </p>
              </div>
            </div>,
            document.body
          )}

        </div>
      )}
    </ChartPanel>
  );
});
