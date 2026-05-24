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
import './TenantRevenueVelocityChart.css';

interface RevenueVelocityRow {
  day: string;
  revenue: number;
  previousRevenue: number;
}

function buildRows(points: FinancialVelocityPoint[]): RevenueVelocityRow[] {
  return points.map((point) => ({
    day: point.periodLabel,
    revenue: point.currentRevenue,
    previousRevenue: point.previousRevenue,
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.dataKey === 'revenue' ? 'Current' : 'Previous'}:{' '}
          <strong>{formatCompact(entry.value)} SEK</strong>
        </p>
      ))}
    </div>
  );
};

export function TenantRevenueVelocityChart({ points }: { points: FinancialVelocityPoint[] }) {
  const rows = buildRows(points);

  return (
    <ChartPanel title="Revenue Velocity Over Time" bodyClassName="tenant-revenue-velocity-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatCompact(value)}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="previousRevenue"
            stroke="var(--chart-ghost)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-line)"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
