import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OrderBin } from '@types';
import { formatNumber } from '@utils';
import { ChartPanel } from '../common/ChartPanel';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <p className="flex justify-between gap-6">
        <span className="text-slate-500">Orders:</span>
        <strong className="text-[#51B5B9]">{formatNumber(payload[0].value)}</strong>
      </p>
    </div>
  );
};

export function OrderValueDistributionChart({ bins, className }: { bins: OrderBin[], className?: string }) {
  return (
    <ChartPanel
      title="Order Value Distribution"
      className={className || ''}
      bodyClassName="w-full h-full flex flex-col flex-1 min-h-0"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 8, right: 10, left: 8, bottom: 42 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="binLabel"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={58}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="orderCount"
            fill="#51B5B9"
            fillOpacity={0.9}
            radius={[5, 5, 0, 0]}
            maxBarSize={60}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
