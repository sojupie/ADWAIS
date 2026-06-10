import { memo } from 'react';
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
import { formatChartLabel, inferBinSize } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

interface ShareTrajectoryRow {
  label: string;
  portfolioShare: number;
}

function buildRows(tenantVelocity: FinancialVelocityPoint[], portfolioVelocity: FinancialVelocityPoint[],
): ShareTrajectoryRow[] {
  const isHourly = tenantVelocity.length > 0 && tenantVelocity.length <= 24;
  const binSize = inferBinSize(tenantVelocity.map(p => p.timestamp), isHourly);

  return tenantVelocity.map((point, index) => {
    const portfolioRevenue = portfolioVelocity.find(p => p.timestamp === point.timestamp)?.currentRevenue ?? 0;

    return {
      label: formatChartLabel(point.timestamp, binSize, index),
      portfolioShare: portfolioRevenue > 0 ? (point.currentRevenue / portfolioRevenue) * 100 : 0,
    };
  });
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <p className="flex justify-between gap-6">
        <span className="text-slate-500">Share:</span>
        <strong className="text-brand-btn-primary">{payload[0].value.toFixed(2)}%</strong>
      </p>
    </div>
  );
};

export const PortfolioRevenueShareTrajectoryChart = memo(function PortfolioRevenueShareTrajectoryChart({isLoading, tenantVelocity, portfolioVelocity, className}: { isLoading?: boolean; tenantVelocity: FinancialVelocityPoint[]; portfolioVelocity: FinancialVelocityPoint[]; className?: string; }) {
  const rows = buildRows(tenantVelocity, portfolioVelocity);

  return (
    <ChartPanel isLoading={isLoading}
      title="Portfolio Share Trajectory"
      className={className || ''}
      bodyClassName="w-full h-full flex flex-col flex-1 min-h-0"
    >
      <ResponsiveContainer width="100%" height="100%" debounce={150}>
        <AreaChart data={rows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => `${value.toFixed(2)}%`}
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} useTranslate3d={true} />
          <Area
            type="monotone"
            dataKey="portfolioShare"
            stroke="var(--color-brand-btn-primary)"
            strokeWidth={2}
            fill="var(--color-brand-btn-primary)"
            fillOpacity={0.15}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
});
