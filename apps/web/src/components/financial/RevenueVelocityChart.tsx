import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FinancialVelocityPoint } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';

export function RevenueVelocityChart({ points, className }: { points: FinancialVelocityPoint[], className?: string })
{
  return (
      <ChartPanel
          title="Revenue Velocity"
          className={className}
          legend={
            <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-btn-primary" />
                <span>Current Period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-dashed bg-transparent" />
                <span>Previous Period</span>
              </div>
            </div>
          }>
        <RevenueVelocityGraphJSX points={points} />
      </ChartPanel>
  );
}

const GraphTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as FinancialVelocityPoint;

  return (
      <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
        <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
        <div className="space-y-2">
          <p className="flex justify-between gap-6">
            <span className="text-slate-500">Previous:</span>
            <strong className="text-slate-700">{formatCompact(point.previousRevenue)} SEK</strong>
          </p>
          <p className="flex justify-between gap-6">
            <span className="text-slate-500">Current:</span>
            <strong className="text-brand-btn-primary">{formatCompact(point.currentRevenue)} SEK</strong>
          </p>
        </div>
      </div>
  );
};

//can probably move a lot of styling over to the styling file
function RevenueVelocityGraphJSX({ points }: { points: FinancialVelocityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--color-chart-tick)', fontSize: 14, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(revenue) => formatCompact(revenue)}
          tick={{ fill: 'var(--color-chart-tick)', fontSize: 14, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip content={<GraphTooltip />} />
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
