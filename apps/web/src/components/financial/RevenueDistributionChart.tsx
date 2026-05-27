import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DistributionEntry } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const revenue = payload.find((entry: any) => entry.dataKey === 'absoluteRevenue')?.value ?? 0;
  const cumulativeShare = payload.find((entry: any) => entry.dataKey === 'cumulativePortfolioShare')?.value ?? 0;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <div className="space-y-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Revenue:</span>
          <strong className="text-[#51B5B9]">{formatCompact(revenue)} SEK</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Cumulative:</span>
          <strong className="text-slate-700">{(cumulativeShare * 100).toFixed(1)}%</strong>
        </p>
      </div>
    </div>
  );
};

export function RevenueDistributionChart({ entries, onTenantSelect, className }: {
entries: DistributionEntry[]; onTenantSelect?: (tenantId: string) => void; className?: string; })
{
  if (entries.length === 0) return null;

  return (
    <ChartPanel title="Portfolio Revenue Distribution" className={className || "h-full"} bodyClassName="revenue-distribution-chart flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={entries} margin={{ top: 10, right: 12, left: 4, bottom: 24 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="tenantName"
            tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={56}
          />
          <YAxis
            yAxisId="revenue"
            tickFormatter={(value) => formatCompact(value)}
            tick={{ fill: '#94a3b8', fontSize: 13, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <YAxis
            yAxisId="cumulative"
            orientation="right"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            tick={{ fill: '#64748b', fontSize: 13, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="revenue"
            dataKey="absoluteRevenue"
            className={onTenantSelect ? 'cursor-pointer hover:opacity-90 transition-opacity' : undefined}
            fill="#51B5B9"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            onClick={(row) => {
              const payload = row?.payload as DistributionEntry | undefined;

              if (payload?.tenantId) {
                onTenantSelect?.(payload.tenantId);
              }
            }}
          />
          <Line
            yAxisId="cumulative"
            type="monotone"
            dataKey="cumulativePortfolioShare"
            stroke="#022D2E"
            strokeWidth={3}
            dot={{ r: 5, fill: '#fff', stroke: '#022D2E', strokeWidth: 3 }}
            activeDot={{ r: 7, fill: '#fff', stroke: '#022D2E', strokeWidth: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
