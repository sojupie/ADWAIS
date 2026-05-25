import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CumulativeGrowthDeltaPoint } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './CumulativeGrowthDeltaChart.css';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Delta: <strong>{formatCompact(payload[0].value)} SEK</strong></p>
    </div>
  );
};

export function CumulativeGrowthDeltaChart({ points }: { points: CumulativeGrowthDeltaPoint[] }) {
  return (
    <ChartPanel
      title="Cumulative Growth Delta (Absolute)"
      className="tenant-diagnostics__chart-panel"
      bodyClassName="cumulative-growth-delta-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
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
            type="stepAfter"
            dataKey="cumulativeGrowthDelta"
            stroke="var(--green)"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
