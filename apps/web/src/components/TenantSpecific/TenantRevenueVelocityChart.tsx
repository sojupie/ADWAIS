import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinancialVelocityPoint } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <div className="space-y-2">
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="flex justify-between gap-6">
            <span className="text-slate-500">{entry.dataKey === 'currentRevenue' ? 'Current' : 'Previous'}:</span>
            <strong className={entry.dataKey === 'currentRevenue' ? 'text-[#51B5B9]' : 'text-slate-700'}>
              {formatCompact(entry.value)} SEK
            </strong>
          </p>
        ))}
      </div>
    </div>
  );
};

export function TenantRevenueVelocityChart({ points, className }: { points: FinancialVelocityPoint[], className?: string }) {
  return (
    <ChartPanel
      title="Revenue Velocity Over Time"
      className={className || ''}
      bodyClassName="w-full h-full flex flex-col flex-1 min-h-0"
      legend={
        <div className="flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#51B5B9]" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-dashed bg-transparent" />
            <span>Previous</span>
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatCompact(value)}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="previousRevenue"
            stroke="#cbd5e1"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="currentRevenue"
            stroke="#51B5B9"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
