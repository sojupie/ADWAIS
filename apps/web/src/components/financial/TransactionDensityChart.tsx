import { useState, Fragment } from 'react';
import type { TransactionDensityPointDto } from '@types';
import { formatCurrency } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

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

export function TransactionDensityChart({
  isLoading, points,
  className }: { isLoading?: boolean; 
  points: TransactionDensityPointDto[];
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

  const isEmpty = points.length === 0;
  const maxCount = isEmpty ? 0 : Math.max(...points.map(p => p.count));
  const minCount = isEmpty ? 0 : Math.min(...points.map(p => p.count));

  // Build a 7x24 matrix
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ count: 0, totalRevenue: 0 })));
  points.forEach(p => {
    // API returns dayOfWeek 1-7 (1 = Monday, 7 = Sunday)
    const dayIndex = p.dayOfWeek - 1;
    if (dayIndex >= 0 && dayIndex <= 6 && p.hour >= 0 && p.hour <= 23) {
      matrix[dayIndex][p.hour] = { count: p.count, totalRevenue: p.totalRevenue };
    }
  });

  return (
    <ChartPanel isLoading={isLoading}
      title="Transaction Density Matrix"
      className={className || "h-full relative"}
      bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0 flex flex-col p-4'}
      legend={<span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded">30-Day Rolling Density</span>}
    >
      {isEmpty ? (
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">No data available</span>
      ) : (
        <div className="flex-1 flex flex-col h-full w-full relative">
          
          <div className="flex-1 grid grid-cols-[40px_repeat(24,_1fr)] gap-0.5">
            {/* Header row for Hours */}
            <div className="col-span-1"></div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-center text-[10px] text-slate-500 font-bold self-end pb-1">
                {h.toString().padStart(2, '0')}
              </div>
            ))}

            {/* Matrix rows */}
            {DAYS.map((day, dayIndex) => (
              <Fragment key={day}>
                {/* Day Label */}
                <div className="flex items-center justify-end pr-2 text-[11px] text-slate-500 font-bold">
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
          {hoverInfo && (
            <div 
              className="fixed z-50 bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full w-48"
              style={{ left: hoverInfo.x, top: hoverInfo.y }}
            >
              <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">
                {DAYS[hoverInfo.day]} at {hoverInfo.hour.toString().padStart(2, '0')}:00
              </p>
              <div className="space-y-2">
                <p className="flex justify-between gap-6">
                  <span className="text-slate-500">Transactions:</span>
                  <strong className="text-slate-700">{hoverInfo.count}</strong>
                </p>
                <p className="flex justify-between gap-6">
                  <span className="text-slate-500">Revenue:</span>
                  <strong className="text-slate-700">{formatCurrency(hoverInfo.revenue)}</strong>
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </ChartPanel>
  );
}
