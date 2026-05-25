import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartPanel } from '../common/ChartPanel';
import './NetworkLatencyChart.css';

export interface LatencyPoint {
  label: string;
  timestamp: string;
  average: number;
  previousAverage: number;
  lowest: number;
  highest: number;
}

function formatLatency(value: number): string {
  return `${Math.round(value)}ms`;
}

interface GraphTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: LatencyPoint }>;
}

const GraphTooltip = ({ active, payload, label }: GraphTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as LatencyPoint;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Avg: <strong>{formatLatency(point.average)}</strong></p>
      <p>Previous: <strong>{formatLatency(point.previousAverage)}</strong></p>
      <p>High: <strong>{formatLatency(point.highest)}</strong></p>
    </div>
  );
};

export function NetworkLatencyChart({ points }: { points: LatencyPoint[] }) {
  const showDots = points.length < 2;

  return (
    <ChartPanel
      title="Network Latency"
      bodyClassName="network-latency-chart"
      legend={
        <div className="chart-panel__legend">
          <span className="network-latency-chart__legend-dot network-latency-chart__legend-dot--avg" />
          <span>Avg Latency</span>
          <span className="network-latency-chart__legend-dot network-latency-chart__legend-dot--p95" />
          <span>Previous Avg</span>
        </div>
      }
    >
      {points.length === 0 ? (
        <div className="network-latency-chart__empty">No latency data</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatLatency}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={54}
            />
            <Tooltip content={<GraphTooltip />} />
            <Line
              type="monotone"
              dataKey="previousAverage"
              className="network-latency-chart__p95-line"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={showDots ? { r: 3, strokeWidth: 0 } : false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="average"
              className="network-latency-chart__avg-line"
              strokeWidth={2.8}
              dot={showDots ? { r: 4, strokeWidth: 0 } : false}
              activeDot={{ r: 4, fill: 'var(--chart-line)', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}
