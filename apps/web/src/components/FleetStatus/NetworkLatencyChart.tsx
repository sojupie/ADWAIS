import { memo, useMemo } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart
} from 'recharts';
import type { LatencyPoint, ComparisonPeriod } from '@types';
import { formatChartLabel, inferBinSize } from '@utils';

function formatLatency(value: number): string {
  return `${Math.round(value)}ms`;
}

interface GraphTooltipProps {
  isLoading?: boolean;
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: LatencyPoint, name: string, color: string }>;
}

const GraphTooltip = ({ active, payload, label }: GraphTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as LatencyPoint;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-brand-text mb-3 border-b border-slate-50 pb-2 uppercase tracking-widest text-sm">{label}</p>
      <div className="space-y-2">
        <p className="flex justify-between gap-8">
          <span className="text-slate-500 font-bold uppercase text-sm tracking-widest">Current Avg</span> 
          <strong className="text-brand-btn-primary">{formatLatency(point.average)}</strong>
        </p>
        <p className="flex justify-between gap-8">
          <span className="text-slate-500 font-bold uppercase text-sm tracking-widest">Previous Avg</span> 
          <strong className="text-slate-500">{formatLatency(point.previousAverage)}</strong>
        </p>
        <div className="pt-2 border-t border-slate-50 mt-2 space-y-1">
          <p className="flex justify-between gap-8">
            <span className="text-slate-500 font-bold uppercase text-sm tracking-widest">Highest</span> 
            <strong className="text-red-500 text-sm">{formatLatency(point.highest)}</strong>
          </p>
          <p className="flex justify-between gap-8">
            <span className="text-slate-500 font-bold uppercase text-sm tracking-widest">Lowest</span> 
            <strong className="text-emerald-500 text-sm">{formatLatency(point.lowest)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

import { ChartPanel } from '../common/charts/ChartPanel';
import { EmptyState } from '../common/ui/EmptyState';

export const NetworkLatencyChart = memo(function NetworkLatencyChart({ 
  isLoading, 
  isStale,
  points, 
  title = "Network Latency", 
  className,
  comparison = 'Preceding'
}: { 
  isLoading?: boolean; 
  isStale?: boolean;
  points: LatencyPoint[]; 
  title?: string; 
  className?: string;
  comparison?: ComparisonPeriod;
}) {
  const chartData = useMemo(() => {
    const isHourly = points.length > 0 && points.length <= 24;
    const binSize = inferBinSize(points.map(p => p.timestamp), isHourly);
    return points.map((p, i) => ({
      ...p,
      label: formatChartLabel(p.timestamp, binSize, i)
    }));
  }, [points]);

  const legend = (
    <div className="flex gap-4 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-brand-btn-primary"></div>
        <span>Current</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 border-dashed bg-transparent"></div>
        <span>Previous</span>
      </div>
    </div>
  );

  const isEmpty = points.length === 0;

  return (
    <ChartPanel
      isLoading={isLoading}
      isStale={isStale}
      title={title}
      comparison={comparison}
      legend={legend}
      className={className}
      bodyClassName={isEmpty ? "flex items-center justify-center" : ""}
    >
      {isEmpty ? (
        <EmptyState message="No latency data available" variant="minimal" />
      ) : (
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                fontSize={12} 
                tick={{ fill: 'var(--color-chart-tick)', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }} 
                tickMargin={15} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tickLine={false} 
                tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }} 
                axisLine={false}
                minTickGap={30}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip content={<GraphTooltip />} useTranslate3d={true} isAnimationActive={false} />
              <Line 
                type="monotone" 
                dataKey="previousAverage" 
                name="Previous Period" 
                stroke="var(--color-chart-prev-line)" 
                strokeWidth={2} 
                strokeDasharray="6 6" 
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                name="Current Period" 
                stroke="var(--color-brand-btn-primary)" 
                strokeWidth={4} 
                dot={false}
                activeDot={{ r: 6, fill: 'var(--color-brand-btn-primary)', stroke: '#fff', strokeWidth: 3 }} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartPanel>
  );
});
