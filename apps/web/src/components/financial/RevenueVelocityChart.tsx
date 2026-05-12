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
import './ChartCard.css';

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
  const prevMap = new Map(previous.map((r) => [r.createdDate.slice(5), r.globalRevenue]));

  return sorted.map((r) => ({
    date: formatDate(r.createdDate),
    revenue: r.globalRevenue,
    prevRevenue: prevMap.get(r.createdDate.slice(5)),
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
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

  return (
    <div className="chart-card card">
      <div className="chart-card__header">
        <span className="chart-card__title">Revenue Velocity</span>
        <div className="chart-card__legend">
          <span className="chart-card__legend-dot" style={{ background: 'var(--chart-line)' }} />
          <span>Current Period</span>
          <span className="chart-card__legend-dot" style={{ background: 'var(--chart-ghost)' }} />
          <span>Previous Period</span>
        </div>
      </div>

      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--chart-line)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--chart-line)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              stroke="var(--chart-ghost)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
              activeDot={false}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-line)"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--chart-line)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
