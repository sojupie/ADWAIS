import { memo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AccumulatedRevenuePointDto, ComparisonPeriod } from '@types';
import { ChartPanel } from '../common/charts/ChartPanel';
import { formatCurrency, formatChartLabel, inferBinSize } from '@utils';
import { EmptyState } from '../common/ui/EmptyState';

interface AccumulatedRevenueChartProps {
  isLoading?: boolean;
  isStale?: boolean;
  points: AccumulatedRevenuePointDto[];
  comparison?: ComparisonPeriod;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; color?: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <p key={index} className="flex justify-between gap-6 text-slate-500">
            <span>{entry.name}:</span>
            <strong style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </strong>
          </p>
        ))}
      </div>
    </div>
  );
};

export const AccumulatedRevenueChart = memo(function AccumulatedRevenueChart({ isLoading, isStale, points, comparison, className }: AccumulatedRevenueChartProps) {
  const binSize = inferBinSize(points.map(p => p.timestamp), false);
  const chartData = points.map((p, i) => ({
    ...p,
    label: formatChartLabel(p.timestamp, binSize, i)
  }));

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale} title="Revenue Performance" comparison={comparison} className={className} bodyClassName={points.length === 0 ? "flex items-center justify-center" : ""}>
      {points.length === 0 ? (
        <EmptyState message="No revenue data available" variant="minimal" />
      ) : (
        <ResponsiveContainer width="100%" height="100%" debounce={150}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-chart-grid)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }} 
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-chart-grid)', opacity: 0.4 }} useTranslate3d={true} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            
            {/* Discrete Revenue (Bars) */}
            <Bar 
              yAxisId="left"
              dataKey="currentRevenue" 
              name="Current Revenue" 
              fill="var(--color-brand-btn-primary)"
              fillOpacity={0.25}
              radius={[4, 4, 0, 0]} 
              barSize={20}
              isAnimationActive={false}
            />

            {/* Accumulated Revenue (Lines) */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="previousAccumulated" 
              name="Previous Accumulated"
              stroke="var(--color-chart-tick)" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="currentAccumulated" 
              name="Current Accumulated"
              stroke="var(--color-brand-btn-primary)" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
});
