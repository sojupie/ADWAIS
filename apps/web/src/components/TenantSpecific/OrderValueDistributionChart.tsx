import { memo } from 'react';
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OrderBin } from '@types';
import { formatNumber } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

const CustomTooltip = ({ active, payload, label }: { isLoading?: boolean;  active?: boolean; payload?: { dataKey?: string | number; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  const orderCount = payload.find(p => p.dataKey === 'orderCount')?.value;
  const cdf = payload.find(p => p.dataKey === 'cumulativePercentage')?.value;
  const kde = payload.find(p => p.dataKey === 'kdeDensity')?.value;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200 min-w-[200px]">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <div className="flex flex-col gap-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Volume:</span>
          <strong className="text-brand-btn-primary">{formatNumber(orderCount || 0)}</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Density (KDE):</span>
          <strong className="text-teal-600">{formatNumber(kde || 0)}</strong>
        </p>
        <p className="flex justify-between gap-6 mt-1 pt-2 border-t border-slate-50">
          <span className="text-slate-500">Cumulative:</span>
          <strong className="text-orange-500">{cdf?.toFixed(1) || 0}%</strong>
        </p>
      </div>
    </div>
  );
};

export const OrderValueDistributionChart = memo(function OrderValueDistributionChart({ isLoading, isStale, bins, className }: { isLoading?: boolean; isStale?: boolean; bins: OrderBin[], className?: string }) {
  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Order Distribution & Shipping Threshold"
      className={className || ''}
      bodyClassName=""
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={bins} margin={{ top: 16, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="binLabel"
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={70}
            interval={0}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: '#f97316', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} useTranslate3d={true} isAnimationActive={false} />
          <Legend wrapperStyle={{ bottom: 0, fontSize: '12px', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }} />
          
          <Bar
            yAxisId="left"
            name="Volume (Orders)"
            dataKey="orderCount"
            fill="var(--color-brand-btn-primary)"
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
            isAnimationActive={false}
          />
          
          <Line
            yAxisId="left"
            name="Density Curve"
            type="monotone"
            dataKey="kdeDensity"
            stroke="#0d9488"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />

          <Line
            yAxisId="right"
            name="Cumulative % (Right Axis)"
            type="monotone"
            dataKey="cumulativePercentage"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />

          <ReferenceLine yAxisId="right" y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.6} />
          <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="3 3" opacity={0.6} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
});
