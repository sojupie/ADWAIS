import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { TenantKpi } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './MomentumMatrixChart.css';

interface Props {
  tenants: TenantKpi[];
}

interface MomentumPoint {
  tenantId: string;
  tenantName: string;
  baselineRevenue: number;
  totalRevenue: number;
  revenuePoP: number;
}

function buildPoints(tenants: TenantKpi[]): MomentumPoint[] {
  return tenants
    .filter((tenant) => (
      tenant.previousRevenue > 0
      && tenant.totalRevenue > 0
      && Number.isFinite(tenant.revenuePoP)
    ))
    .map((tenant) => ({
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      baselineRevenue: tenant.previousRevenue,
      totalRevenue: tenant.totalRevenue,
      revenuePoP: tenant.revenuePoP,
    }));
}

function getRevenueDomain(points: MomentumPoint[]): [number, number] {
  const maxValue = Math.max(
    ...points.map((point) => Math.max(point.baselineRevenue, point.totalRevenue)),
    1
  );
  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const rounded = Math.ceil(maxValue / magnitude) * magnitude;

  return [0, rounded];
}

function getPercentDomain(points: MomentumPoint[]): [number, number] {
  const minValue = Math.min(...points.map((point) => point.revenuePoP), 0);
  const maxValue = Math.max(...points.map((point) => point.revenuePoP), 0);
  const paddedMin = Math.floor((minValue - 10) / 25) * 25;
  const paddedMax = Math.ceil((maxValue + 10) / 25) * 25;

  return [Math.max(paddedMin, -100), Math.min(Math.max(paddedMax, 25), 200)];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as MomentumPoint;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{point.tenantName}</p>
      <p>Baseline: <strong>{formatCompact(point.baselineRevenue)} SEK</strong></p>
      <p>Current: <strong>{formatCompact(point.totalRevenue)} SEK</strong></p>
      <p>Momentum: <strong>{point.revenuePoP.toFixed(1)}%</strong></p>
    </div>
  );
};

const TenantLabel = ({ x, y, index, payload }: any) => {
  if (x == null || y == null || !payload) return null;

  const dx = index % 2 === 0 ? 8 : -8;
  const dy = index % 3 === 0 ? -10 : 16;

  return (
    <text
      x={x + dx}
      y={y + dy}
      textAnchor={dx > 0 ? 'start' : 'end'}
      className="momentum-matrix-chart__label"
    >
      {payload.tenantName}
    </text>
  );
};

export function MomentumMatrixChart({ tenants }: Props) {
  const points = buildPoints(tenants);
  const legend = (
    <span className="momentum-matrix-chart__legend">
      Size = Total Rev Contribution
    </span>
  );

  if (points.length === 0) {
    return (
      <ChartPanel title="Momentum Matrix" legend={legend} bodyClassName="momentum-matrix-chart momentum-matrix-chart--empty">
        <span className="momentum-matrix-chart__empty">No previous-period baseline data</span>
      </ChartPanel>
    );
  }

  const revenueDomain = getRevenueDomain(points);
  const percentDomain = getPercentDomain(points);

  return (
    <ChartPanel title="Momentum Matrix" legend={legend} bodyClassName="momentum-matrix-chart">
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 24, left: 12, bottom: 14 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" />
          <XAxis
            type="number"
            dataKey="baselineRevenue"
            name="P30 Baseline Revenue"
            domain={revenueDomain}
            tickFormatter={(value) => formatCompact(value)}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'P30 Baseline Revenue',
              position: 'insideBottom',
              offset: -8,
              fill: 'var(--text-primary)',
              fontSize: 10,
            }}
          />
          <YAxis
            type="number"
            dataKey="revenuePoP"
            name="Revenue Momentum"
            domain={percentDomain}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <ZAxis type="number" dataKey="totalRevenue" range={[80, 980]} />
          <ReferenceLine x={0} stroke="var(--button-border)" strokeDasharray="3 3" />
          <ReferenceLine y={0} stroke="var(--button-border)" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            data={points}
            fill="var(--chart-line)"
            fillOpacity={0.62}
            stroke="var(--bg-primary)"
            strokeWidth={1.5}
            label={<TenantLabel />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
