import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GrowthExtreme } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './GrowthExtremesChart.css';

const formatGrowth = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const tenant = payload[0].payload as GrowthExtreme;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{tenant.tenantName}</p>
      <p>Growth: <strong>{formatGrowth(tenant.growthPercentage)}</strong></p>
      <p>Current: <strong>{formatCompact(tenant.currentRevenue)} SEK</strong></p>
      <p>Previous: <strong>{formatCompact(tenant.previousRevenue)} SEK</strong></p>
      <p>Variance: <strong>{formatCompact(tenant.absoluteVariance)} SEK</strong></p>
    </div>
  );
};

export function GrowthExtremesChart({ tenants, onTenantSelect }: {
  tenants: GrowthExtreme[]; onTenantSelect?: (tenantId: string) => void;
}) {
  if (tenants.length === 0) return null;

  const maxAbsGrowth = Math.max(
    1,
    ...tenants.map((tenant) => Math.abs(tenant.growthPercentage)),
  );
  const chartHeight = Math.max(280, tenants.length * 30);

  return (
    <ChartPanel title="Growth Extremes" bodyClassName="extremes-chart">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={tenants}
          layout="vertical"
          margin={{ top: 6, right: 28, left: 8, bottom: 18 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" horizontal={false} />
          <XAxis
            type="number"
            domain={[-maxAbsGrowth, maxAbsGrowth]}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="tenantName"
            width={104}
            tick={{ fill: 'var(--text-primary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="var(--bg-border)" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-primaryNeigbour)' }} />
          <Bar
            dataKey="growthPercentage"
            className={onTenantSelect ? 'extremes-chart__bar--clickable' : undefined}
            radius={[5, 5, 5, 5]}
            barSize={16}
            onClick={(row) => {
              const payload = row?.payload as GrowthExtreme | undefined;

              if (payload?.tenantId) {
                onTenantSelect?.(payload.tenantId);
              }
            }}
          >
            {tenants.map((tenant) => (
              <Cell
                key={tenant.tenantId}
                fill={tenant.growthPercentage < 0 ? 'var(--red)' : 'var(--green)'}
                fillOpacity={0.82}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
