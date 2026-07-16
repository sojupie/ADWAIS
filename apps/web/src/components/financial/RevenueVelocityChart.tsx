import { memo, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FinancialVelocityPoint, ComparisonPeriod } from '@types';
import { formatCompact, formatChartLabel, inferBinSize } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

export const RevenueVelocityChart = memo(function RevenueVelocityChart({ isLoading, points, comparison, className }: { isLoading?: boolean;  points: FinancialVelocityPoint[], comparison?: ComparisonPeriod, className?: string })
{
  return (
      <ChartPanel isLoading={isLoading}
          title="Revenue Velocity"
          comparison={comparison}
          className={className}
          legend={
            <div className="flex items-center gap-12 text-sm font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded">
              <div className="flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-brand-btn-primary" />
                <span>Current Period</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-3 h-3 rounded-full border-2 border-outline-variant border-dashed bg-transparent" />
                <span>Previous Period</span>
              </div>
            </div>
          }>
        <RevenueVelocityGraphJSX points={points} />
      </ChartPanel>
  );
});

const GraphTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: unknown }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as FinancialVelocityPoint;

  return (
      <div className="bg-surface border border-outline-variant rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
        <p className="font-bold text-on-surface mb-3 border-b border-slate-50 pb-2">{label}</p>
        <div className="space-y-2">
          <p className="flex justify-between gap-12">
            <span className="text-on-surface-variant">Previous:</span>
            <strong className="text-on-surface-variant">{formatCompact(point.previousRevenue)} SEK</strong>
          </p>
          <p className="flex justify-between gap-12">
            <span className="text-on-surface-variant">Current:</span>
            <strong className="text-brand-btn-primary">{formatCompact(point.currentRevenue)} SEK</strong>
          </p>
        </div>
      </div>
  );
};

//can probably move a lot of styling over to the styling file
function RevenueVelocityGraphJSX({ points }: { isLoading?: boolean;  points: FinancialVelocityPoint[] }) {
  const chartData = useMemo(() => {
    const isHourly = points.length > 0 && points.length <= 24;
    const binSize = inferBinSize(points.map(p => p.timestamp), isHourly);
    return points.map((p, i) => ({
      ...p,
      label: formatChartLabel(p.timestamp, binSize, i)
    }));
  }, [points]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 12, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--color-chart-tick)', fontSize: 14, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }}
          minTickGap={20}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<GraphTooltip />} useTranslate3d={true} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="previousRevenue"
          stroke="var(--color-chart-prev-line)"
          strokeWidth={3}
          strokeDasharray="6 6"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="currentRevenue"
          stroke="var(--color-brand-btn-primary)"
          strokeWidth={4}
          dot={false}
          activeDot={{ r: 6, fill: 'var(--color-brand-btn-primary)', stroke: '#fff', strokeWidth: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
