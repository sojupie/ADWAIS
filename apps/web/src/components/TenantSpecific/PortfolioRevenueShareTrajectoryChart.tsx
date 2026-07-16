import { memo, useMemo } from 'react';
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
    <div className="bg-surface border border-outline-variant rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-on-surface mb-3 border-b border-slate-50 pb-2">{label}</p>
      <p className="flex justify-between gap-12">
        <span className="text-on-surface-variant">Share:</span>
        <strong className="text-brand-btn-primary">{payload[0].value.toFixed(2)}%</strong>
      </p>
    </div>
  );
};

export const PortfolioRevenueShareTrajectoryChart = memo(function PortfolioRevenueShareTrajectoryChart({isLoading, tenantVelocity, portfolioVelocity, className}: { isLoading?: boolean; tenantVelocity: FinancialVelocityPoint[]; portfolioVelocity: FinancialVelocityPoint[]; className?: string; }) {
  const rows = useMemo(() => buildRows(tenantVelocity, portfolioVelocity), [tenantVelocity, portfolioVelocity]);

  return (
    <ChartPanel isLoading={isLoading}
      title="Portfolio Share Trajectory"
      className={className || ''}
      bodyClassName=""
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(val) => `${val}%`}
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 12 }}
            minTickGap={20}
            axisLine={false}
            tickLine={false}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} useTranslate3d={true} isAnimationActive={false} />
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
