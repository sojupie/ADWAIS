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
import './RevenueVelocityChart.css';

export function RevenueVelocityChart({ points }: { points: FinancialVelocityPoint[] })
{
  return (
      <ChartPanel
          title="Revenue Velocity"
          legend={
            <div className="chart-panel__legend">
              <span className="revenue-velocity-chart__legend-dot" style={{ background: 'var(--chart-line)' }} />
              <span>Current Period</span>
              <span className="revenue-velocity-chart__legend-dot" style={{ background: 'var(--chart-ghost)' }} />
              <span>Previous Period</span>
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
      <div className="chart-panel-tooltip">
        <p className="chart-panel-tooltip__label">{label}</p>
        <p>Previous: <strong>{formatCompact(point.previousRevenue)} SEK</strong></p>
        <p>Current: <strong>{formatCompact(point.currentRevenue)} SEK</strong></p>
      </div>
  );
};

//can probably move a lot of styling over to the styling file
function RevenueVelocityGraphJSX({ points }: { points: FinancialVelocityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(revenue) => formatCompact(revenue)}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<GraphTooltip />} />
        <Line
          type="monotone"
          dataKey="previousRevenue"
          className="revenue-velocity-chart__previous-line"
          strokeWidth={2.5}
          strokeDasharray="4 3"
          dot={false}
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="currentRevenue"
          className="revenue-velocity-chart__current-line"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--chart-line)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
