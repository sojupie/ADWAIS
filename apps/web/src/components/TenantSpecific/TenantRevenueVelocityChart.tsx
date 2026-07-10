import { memo, useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinancialVelocityPoint, ComparisonPeriod } from '@types';
import { formatChartLabel, inferBinSize, formatCompact } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

const CustomTooltip = ({ active, payload, label }: { isLoading?: boolean;  active?: boolean; payload?: { dataKey?: string | number; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface border border-outline-variant rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-on-surface mb-3 border-b border-slate-50 pb-2">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex justify-between gap-6">
            <span className="text-on-surface-variant">{entry.dataKey === 'currentRevenue' ? 'Current' : 'Previous'}:</span>
            <strong className={entry.dataKey === 'currentRevenue' ? 'text-brand-btn-primary' : 'text-on-surface-variant'}>
              {formatCompact(entry.value)} SEK
            </strong>
          </p>
        ))}
      </div>
    </div>
  );
};

export const TenantRevenueVelocityChart = memo(function TenantRevenueVelocityChart({ isLoading, points, comparison, className }: { isLoading?: boolean;  points: FinancialVelocityPoint[], comparison?: ComparisonPeriod, className?: string }) {
  const chartData = useMemo(() => {
    const isHourly = points.length > 0 && points.length <= 24;
    const binSize = inferBinSize(points.map(p => p.timestamp), isHourly);
    return points.map((p, i) => ({
      ...p,
      label: formatChartLabel(p.timestamp, binSize, i)
    }));
  }, [points]);

  return (
    <ChartPanel isLoading={isLoading}
      title="Revenue Velocity Over Time"
      comparison={comparison}
      className={className || ''}
      bodyClassName=""
      legend={
        <div className="flex items-center gap-6 text-sm font-black text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-btn-primary" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-outline-variant border-dashed bg-transparent" />
            <span>Previous</span>
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatCompact(value)}
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 12, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <Tooltip content={<CustomTooltip />} useTranslate3d={true} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="previousRevenue"
            stroke="var(--color-chart-prev-line)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="currentRevenue"
            stroke="var(--color-brand-btn-primary)"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
});
