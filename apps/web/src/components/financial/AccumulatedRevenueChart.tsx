import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AccumulatedRevenuePointDto } from '@types';
import { ChartPanel } from '../common/ChartPanel';
import { formatCurrency } from '@utils';

interface AccumulatedRevenueChartProps {
  isLoading?: boolean;
  points: AccumulatedRevenuePointDto[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
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

export function AccumulatedRevenueChart({ isLoading, points, className }: AccumulatedRevenueChartProps) {
  return (
    <ChartPanel isLoading={isLoading} title="Revenue Performance" className={className}>
      <ResponsiveContainer debounce={50} width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-chart-grid)', opacity: 0.4 }} />
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
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="currentAccumulated" 
            name="Current Accumulated"
            stroke="var(--color-brand-btn-primary)" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
