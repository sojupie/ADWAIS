import { useMemo, useState, Fragment, memo } from 'react';
import { createPortal } from 'react-dom';
import type { TransactionDensityResponse } from '@types';
import { formatCurrency, formatNumber } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import {EmptyState} from "../common/ui/EmptyState.tsx";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  } | null>(null);

  const { points, totalCount, minCount, maxCount } = response;
  const isEmpty = points.length === 0;
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

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Transaction Density Matrix"
      subtitle="30-day rolling density"
      className={className || "h-full relative"}
      bodyClassName={isEmpty ? 'flex items-center h-full justify-center' : 'flex-1 min-h-0 flex flex-col p-4'}
      legend={
      <div className="flex flex-wrap items-end justify-end gap-4">
        <div className="text-right leading-none">
          <strong className="block text-2xl font-black tabular-nums text-on-surface">{formatNumber(totalCount)}</strong>
          <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">transactions</span>
        </div>
        <div className="w-36 min-w-28" aria-label={`Density ranges from ${minCount} to ${maxCount} transactions per bucket`}>
          <div className="mb-1 flex justify-between text-xs font-bold tabular-nums text-on-surface-variant">
            <span>{formatNumber(minCount)}</span>
            <span>{formatNumber(maxCount)}</span>
          </div>
          <div
            className="h-3 rounded-full"
            style={{ background: `linear-gradient(to right, ${PALETTE.join(', ')})` }}
          />
          <span className="mt-1 block text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">transactions / bucket</span>
        </div>
      </div>}
    >
      {isEmpty ? (
        <EmptyState message={"No data available"} variant={"minimal"}/>
      ) : (
        <div className="flex-1 flex flex-col h-full w-full relative overflow-x-auto custom-scrollbar">
          
          <div className="flex-1 grid grid-cols-[40px_repeat(24,_1fr)] gap-0.5 min-w-[600px] lg:min-w-0 pb-2">
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
                      className="w-full h-full min-h-[20px] rounded-[2px] transition-opacity cursor-pointer hover:opacity-80 hover:ring-1 ring-slate-400"
                      style={{ backgroundColor: color }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoverInfo({
                          day: dayIndex,
                          hour: hourIndex,
                          count: cellData.count,
                          revenue: cellData.totalRevenue || 0,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }}
                      onMouseLeave={() => setHoverInfo(null)}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          {/* Custom Tooltip */}
          {hoverInfo && createPortal(
            <div 
              className="fixed min-w-min z-50 bg-surface border border-outline-variant rounded-lg shadow-lg p-4 text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full w-48"
              style={{ left: hoverInfo.x, top: hoverInfo.y }}
            >
              <p className="font-bold text-on-surface mb-3 border-b border-slate-50 pb-2">
                {DAYS[hoverInfo.day]} at {hoverInfo.hour.toString().padStart(2, '0')}:00
              </p>
              <div className="space-y-2">
                <p className="flex justify-between gap-12">
                  <span className="text-on-surface-variant">Transactions:</span>
                  <strong className="text-on-surface-variant">{hoverInfo.count}</strong>
                </p>
                <p className="flex justify-between gap-12">
                  <span className="text-on-surface-variant">Revenue:</span>
                  <strong className="text-on-surface-variant">{formatCurrency(hoverInfo.revenue)}</strong>
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
