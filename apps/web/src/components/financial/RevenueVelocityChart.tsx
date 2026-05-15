import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyGlobalRollup } from '@types';
import { formatDate, formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './RevenueVelocityChart.css';


//should probably be reworked to handle for example no sale days.
interface Props {
  current: DailyGlobalRollup[];
  previous: DailyGlobalRollup[];
}

interface ChartRow {
  date: string;
  revenue: number;
  prevRevenue?: number;
}

function buildRows(current: DailyGlobalRollup[], previous: DailyGlobalRollup[]): ChartRow[] {
  const sorted = [...current].sort(
    (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
  );
  const sortedPrevious = [...previous].sort(
    (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
  );

  return sorted.map((r, index) => ({
    date: formatDate(r.createdDate),
    revenue: r.globalRevenue,
    prevRevenue: sortedPrevious[index]?.globalRevenue,
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name === 'revenue' ? 'Current' : 'Previous'}: {' '}
          <strong>{formatCompact(entry.value)} SEK</strong>
        </p>
      ))}
    </div>
  );
};

export function RevenueVelocityChart({ current, previous }: Props) {
  const rows = buildRows(current, previous);
  const legend = (
    <div className="chart-panel__legend">
      <span className="revenue-velocity-chart__legend-dot" style={{ background: 'var(--chart-line)' }} />
      <span>Current Period</span>
      <span className="revenue-velocity-chart__legend-dot" style={{ background: 'var(--chart-ghost)' }} />
      <span>Previous Period</span>
    </div>
  );

  return (
    <ChartPanel title="Revenue Velocity" legend={legend}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => formatCompact(v)}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="prevRevenue"
            className="revenue-velocity-chart__previous-line"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="none"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            className="revenue-velocity-chart__current-line"
            strokeWidth={2}
            fill="none"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--chart-line)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
