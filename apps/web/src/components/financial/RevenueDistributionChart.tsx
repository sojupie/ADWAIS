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
import './RevenueDistributionChart.css';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const revenue = payload.find((entry: any) => entry.dataKey === 'absoluteRevenue')?.value ?? 0;
  const cumulativeShare = payload.find((entry: any) => entry.dataKey === 'cumulativePortfolioShare')?.value ?? 0;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Revenue: <strong>{formatCompact(revenue)} SEK</strong></p>
      <p>Cumulative: <strong>{(cumulativeShare * 100).toFixed(1)}%</strong></p>
    </div>
  );
};

export function RevenueDistributionChart({ entries, onTenantSelect }: {
entries: DistributionEntry[]; onTenantSelect?: (tenantId: string) => void; })
{
  if (entries.length === 0) return null;

  return (
    <ChartPanel title="Portfolio Revenue Distribution" bodyClassName="revenue-distribution-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={entries} margin={{ top: 10, right: 12, left: 4, bottom: 24 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="tenantName"
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
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
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
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
            tick={{ fill: 'var(--text-primary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="revenue"
            dataKey="absoluteRevenue"
            className={onTenantSelect ? 'revenue-distribution-chart__bar--clickable' : undefined}
            fill="var(--chart-line)"
            fillOpacity={0.78}
            radius={[5, 5, 0, 0]}
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
            stroke="var(--text-primary)"
            strokeWidth={2.4}
            dot={{ r: 4.5, fill: 'var(--bg-primary)', stroke: 'var(--text-primary)', strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: 'var(--bg-primary)', stroke: 'var(--text-primary)', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
