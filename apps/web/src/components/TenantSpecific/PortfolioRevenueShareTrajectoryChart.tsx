import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinancialVelocityPoint } from '@types';
import { ChartPanel } from '../common/ChartPanel';
import './PortfolioRevenueShareTrajectoryChart.css';

interface ShareTrajectoryRow {
  day: string;
  portfolioShare: number;
}

function buildRows(
  tenantVelocity: FinancialVelocityPoint[],
  portfolioVelocity: FinancialVelocityPoint[],
): ShareTrajectoryRow[] {
  return tenantVelocity.map((point, index) => {
    const portfolioRevenue = portfolioVelocity[index]?.currentRevenue ?? 0;

    return {
      day: point.periodLabel,
      portfolioShare: portfolioRevenue > 0 ? (point.currentRevenue / portfolioRevenue) * 100 : 0,
    };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Share: <strong>{payload[0].value.toFixed(2)}%</strong></p>
    </div>
  );
};

export function PortfolioRevenueShareTrajectoryChart({
  tenantVelocity,
  portfolioVelocity,
}: {
  tenantVelocity: FinancialVelocityPoint[];
  portfolioVelocity: FinancialVelocityPoint[];
}) {
  const rows = buildRows(tenantVelocity, portfolioVelocity);

  return (
    <ChartPanel title="Portfolio Revenue Share Trajectory" bodyClassName="portfolio-revenue-share-chart">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={rows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => `${value.toFixed(2)}%`}
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="portfolioShare"
            stroke="var(--chart-line)"
            strokeWidth={1.8}
            fill="var(--chart-line)"
            fillOpacity={0.16}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
