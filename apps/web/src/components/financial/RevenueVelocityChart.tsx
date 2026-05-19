import {
  LineChart,
  Line,
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

//may need some smarter way to handle no sale days on current day as well
interface graphPoint {
  date: string;
  currentRevenue?: number;
  prevRevenue?: number;
}

export function RevenueVelocityChart({current, previous,}: { current: DailyGlobalRollup[]; previous: DailyGlobalRollup[]; })
{
  const graphPoints = buildPoints(current, previous);

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
        <RevenueVelocityGraphJSX points={graphPoints} />
      </ChartPanel>
  );
}

function buildPoints(current: DailyGlobalRollup[], previous: DailyGlobalRollup[]): graphPoint[] {
  //assumes data is returned unsorted by date.
  const sortedCurrent = [...current].sort(
    (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
  );
  const sortedPrevious = [...previous].sort(
    (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
  );

  return sortedCurrent.map((dailyGlobalRollup, index) => ({
    date: formatDate(dailyGlobalRollup.createdDate),
    currentRevenue: dailyGlobalRollup.globalRevenue,
    prevRevenue: sortedPrevious[index]?.globalRevenue,
  }));
}

//refactor again later prob.
const GraphTooltip = ({ active, payload: pointValues, label: date }: any) => {
  if (!active || !pointValues?.length) return null;
  const previousRevenue = pointValues.find(
      (pointValue: any) => pointValue.name === 'prevRevenue'
  );
  const currentRevenue = pointValues.find(
      (pointValue: any) => pointValue.name === 'currentRevenue'
  );
  
  return (
      <div className="chart-panel-tooltip">
        <p className="chart-panel-tooltip__label">{date}</p>
        {previousRevenue && (<p>
              Previous: <strong>{formatCompact(previousRevenue.value)} SEK</strong>
            </p>
        )}
        {currentRevenue && (<p>
              Current: <strong>{formatCompact(currentRevenue.value)} SEK</strong>
            </p>
        )}
      </div>
  );
};

//can probably move a lot of styling over to the styling file
function RevenueVelocityGraphJSX({ points }: { points: graphPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(revenue) => formatCompact(revenue)}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<GraphTooltip />} />
        <Line
          type="monotone"
          dataKey="prevRevenue"
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
