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
import type { TenantKpi } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './RevenueDistributionChart.css';

interface Props {
  tenants: TenantKpi[];
  maxTenants?: number;
  onTenantSelect?: (tenantId: string) => void;
}

interface DistributionRow {
  tenantId: string;
  tenantName: string;
  revenue: number;
  cumulativePct: number;
  isSelectable: boolean;
}

function buildRows(tenants: TenantKpi[], maxTenants: number): DistributionRow[] {
  const sorted = [...tenants]
    .filter((tenant) => tenant.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const visible = sorted.slice(0, maxTenants);
  const otherRevenue = sorted
    .slice(maxTenants)
    .reduce((sum, tenant) => sum + tenant.totalRevenue, 0);

  const rows = [
    ...visible.map((tenant) => ({
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      totalRevenue: tenant.totalRevenue,
      isSelectable: true,
    })),
    ...(otherRevenue > 0
      ? [{
          tenantId: 'other',
          tenantName: 'Other',
          totalRevenue: otherRevenue,
          isSelectable: false,
        }]
      : []),
  ];

  const totalRevenue = rows.reduce((sum, tenant) => sum + tenant.totalRevenue, 0);
  let cumulativeRevenue = 0;

  return rows.map((tenant) => {
    cumulativeRevenue += tenant.totalRevenue;

    return {
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      revenue: tenant.totalRevenue,
      cumulativePct: totalRevenue === 0 ? 0 : (cumulativeRevenue / totalRevenue) * 100,
      isSelectable: tenant.isSelectable,
    };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const revenue = payload.find((entry: any) => entry.dataKey === 'revenue')?.value ?? 0;
  const cumulativePct = payload.find((entry: any) => entry.dataKey === 'cumulativePct')?.value ?? 0;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Revenue: <strong>{formatCompact(revenue)} SEK</strong></p>
      <p>Cumulative: <strong>{cumulativePct.toFixed(1)}%</strong></p>
    </div>
  );
};

export function RevenueDistributionChart({ tenants, maxTenants = 10, onTenantSelect }: Props) {
  const rows = buildRows(tenants, maxTenants);

  if (rows.length === 0) return null;

  return (
    <ChartPanel title="Portfolio Revenue Distribution" bodyClassName="revenue-distribution-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={rows} margin={{ top: 10, right: 12, left: 4, bottom: 24 }}>
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
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            className={onTenantSelect ? 'revenue-distribution-chart__bar--clickable' : undefined}
            fill="var(--chart-line)"
            fillOpacity={0.78}
            radius={[5, 5, 0, 0]}
            maxBarSize={48}
            onClick={(row) => {
              const payload = row?.payload as DistributionRow | undefined;

              if (payload?.isSelectable) {
                onTenantSelect?.(payload.tenantId);
              }
            }}
          />
          <Line
            yAxisId="cumulative"
            type="monotone"
            dataKey="cumulativePct"
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
