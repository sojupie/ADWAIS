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
import type { MomentumResponse, MomentumTenant } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './MomentumMatrixChart.css';

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as MomentumTenant;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{point.tenantName}</p>
      <p>Baseline: <strong>{formatCompact(point.baselineRevenue)} SEK</strong></p>
      <p>Current: <strong>{formatCompact(point.currentRevenue)} SEK</strong></p>
      <p>Momentum: <strong>{point.growthPercentage.toFixed(1)}%</strong></p>
    </div>
  );
};

function MomentumScatterPlot({ points, medianBaselineRevenue, onTenantSelect }: { 
points: MomentumTenant[]; medianBaselineRevenue: number; onTenantSelect?: (tenantId: string) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 10, right: 24, left: 12, bottom: 14 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" />
        <XAxis
          type="number"
          dataKey="baselineRevenue"
          name="Previous Baseline Revenue" //should maybe depend on period picked
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Previous Baseline Revenue',
            position: 'insideBottom',
            offset: -3,
            fill: 'var(--text-primary)',
            fontSize: 12,
          }}
        />
        <YAxis
          type="number"
          dataKey="growthPercentage"
          name="Revenue Momentum"
          tickFormatter={(value) => `${value.toFixed(0)}%`}
          tick={{ fill: 'var(--text-primary)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <ZAxis type="number" dataKey="currentRevenue" range={[80, 980]} />
        <ReferenceLine x={medianBaselineRevenue} stroke="var(--button-border)" strokeDasharray="3 3" />
        <ReferenceLine y={0} stroke="var(--button-border)" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter
          data={points}
          className={onTenantSelect ? 'momentum-matrix-chart__scatter--clickable' : undefined}
          fill="var(--chart-line)"
          fillOpacity={0.62}
          stroke="var(--bg-primary)"
          strokeWidth={1.5}
          onClick={(point) => {
            const payload = point?.payload as MomentumTenant | undefined;

            if (payload?.tenantId) {
              onTenantSelect?.(payload.tenantId);
            }
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function MomentumMatrixChart({ momentum, onTenantSelect }: { 
momentum: MomentumResponse; onTenantSelect?: (tenantId: string) => void; })
{
  const points = momentum.tenants;
  const isEmpty = points.length === 0;

  return (
    <ChartPanel
      title="Momentum Matrix"
      legend={<span className="momentum-matrix-chart__legend">Size = Total Rev Contribution</span>}
      bodyClassName={`momentum-matrix-chart${isEmpty ? ' momentum-matrix-chart--empty' : ''}`}
    >
      {isEmpty ? (
        <span className="momentum-matrix-chart__empty">No previous-period baseline data</span>
      ) : (
        <MomentumScatterPlot
          points={points}
          medianBaselineRevenue={momentum.medianBaselineRevenue}
          onTenantSelect={onTenantSelect}
        />
      )}
    </ChartPanel>
  );
}
