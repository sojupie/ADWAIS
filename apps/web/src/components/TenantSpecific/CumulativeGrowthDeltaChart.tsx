import { memo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CumulativeGrowthDeltaPoint, ComparisonPeriod } from '@types';
import {
  formatChartLabel,
  inferBinSize,
  formatCompact
} from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

const CustomTooltip = ({ active, payload, label }: { isLoading?: boolean;  active?: boolean; payload?: { payload: unknown }[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as CumulativeGrowthDeltaPoint;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <div className="space-y-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Current Cumulative:</span>
          <strong className="text-slate-700">{formatCompact(point.currentCumulative)} SEK</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Previous Cumulative:</span>
          <strong className="text-slate-700">{formatCompact(point.previousCumulative)} SEK</strong>
        </p>
        <p className="flex justify-between gap-6 pt-1 border-t border-slate-50">
          <span className="text-slate-500">Delta:</span>
          <strong className={point.cumulativeGrowthDelta >= 0 ? 'text-growth' : 'text-[#c92a2a]'}>
            {point.cumulativeGrowthDelta > 0 ? '+' : ''}{formatCompact(point.cumulativeGrowthDelta)} SEK
          </strong>
        </p>
      </div>
    </div>
  );
};

export const CumulativeGrowthDeltaChart = memo(function CumulativeGrowthDeltaChart({ isLoading, isStale, points, comparison, className }: { isLoading?: boolean; isStale?: boolean; points: CumulativeGrowthDeltaPoint[], comparison?: ComparisonPeriod, className?: string }) {
  const isHourly = points.length > 0 && points.length <= 24;
  const binSize = inferBinSize(points.map(p => p.timestamp), isHourly);
  const chartData = points.map((p, i) => ({
    ...p,
    label: formatChartLabel(p.timestamp, binSize, i)
  }));

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Cumulative Growth Delta (Absolute)"
      comparison={comparison}
      className={className || ''}
      bodyClassName=""
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
            tickFormatter={(value) => `${value > 0 ? '+' : ''}${formatCompact(Math.abs(value))}`}
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }}
            minTickGap={20}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} useTranslate3d={true} />
          <Line
            type="stepAfter"
            dataKey="cumulativeGrowthDelta"
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
