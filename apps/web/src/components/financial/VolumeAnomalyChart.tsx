import { memo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { VolumeAnomalyResponseDto, ComparisonPeriod } from '@types';
import { formatNumber } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import {EmptyState} from "../common/ui/EmptyState.tsx";

const CustomTooltip = ({ active, payload }: { isLoading?: boolean;  active?: boolean; payload?: { payload: unknown }[] }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as VolumeAnomalyResponseDto;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">
        {point.tenantName}
      </p>
      <div className="space-y-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Current Volume:</span>
          <strong className="text-slate-700">{formatNumber(point.currentVolume)}</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Baseline Volume:</span>
          <strong className="text-slate-700">{formatNumber(point.baselineVolume)}</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Deviation:</span>
          <strong className={point.volumeDeviationPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
            {point.volumeDeviationPercentage > 0 ? '+' : ''}{point.volumeDeviationPercentage.toFixed(1)}%
          </strong>
        </p>
      </div>
    </div>
  );
};

export const VolumeAnomalyChart = memo(function VolumeAnomalyChart({
  isLoading, isStale, entries,
  comparison,
  onTenantSelect,
  className }: { isLoading?: boolean; isStale?: boolean;
  entries: VolumeAnomalyResponseDto[];
  comparison?: ComparisonPeriod;
  onTenantSelect?: (tenantId: string) => void;
  className?: string;
}) {
  const isEmpty = entries.length === 0;

  // Sort by deviation (positive to negative or vice versa) for a better visual
  const sortedEntries = [...entries].sort((a, b) => b.volumeDeviationPercentage - a.volumeDeviationPercentage);

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Volume Anomaly Monitor"
      comparison={comparison}
      className={className || "h-full"}
      bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0'}
      legend={<span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded">Deviation from baseline</span>}
    >
      {isEmpty ? (
        <EmptyState message={"No data available"} variant={"minimal"}/>
      ) : (
        <ResponsiveContainer width="100%" height="100%" debounce={150}>
          <BarChart data={sortedEntries} margin={{ top: 10, right: 24, left: 12, bottom: 14 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-chart-grid)" />
            <XAxis
              dataKey="tenantName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontFamily: 'Manrope, sans-serif' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 12, fontFamily: 'Manrope, sans-serif' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-chart-grid)', opacity: 0.4 }} useTranslate3d={true} />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
            <Bar 
              dataKey="volumeDeviationPercentage" 
              className={onTenantSelect ? 'cursor-pointer hover:opacity-90 transition-opacity' : undefined}
              radius={[4, 4, 4, 4]}
              isAnimationActive={false}
              onClick={(row) => {
                const payload = row?.payload as VolumeAnomalyResponseDto | undefined;
                if (payload?.tenantId) {
                  onTenantSelect?.(payload.tenantId.toString());
                }
              }}
            >
              {sortedEntries.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.volumeDeviationPercentage >= 0 ? '#10b981' : '#f43f5e'} // emerald-500 : rose-500
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
});
