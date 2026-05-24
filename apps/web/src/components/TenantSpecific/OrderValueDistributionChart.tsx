import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OrderBin } from '@types';
import { formatNumber } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './OrderValueDistributionChart.css';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Orders: <strong>{formatNumber(payload[0].value)}</strong></p>
    </div>
  );
};

export function OrderValueDistributionChart({ bins }: { bins: OrderBin[] }) {
  return (
    <ChartPanel title="Order Value Distribution" bodyClassName="order-value-distribution-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins} margin={{ top: 8, right: 10, left: 8, bottom: 42 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="binLabel"
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={58}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--text-primary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="orderCount"
            fill="var(--chart-line)"
            fillOpacity={0.84}
            radius={[5, 5, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
