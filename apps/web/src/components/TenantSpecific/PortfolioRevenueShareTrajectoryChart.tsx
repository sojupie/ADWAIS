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

interface ShareTrajectoryRow {
  label: string;
  portfolioShare: number;
}

function buildRows(tenantVelocity: FinancialVelocityPoint[], portfolioVelocity: FinancialVelocityPoint[],
): ShareTrajectoryRow[] {
  return tenantVelocity.map((point, index) => {
    const portfolioRevenue = portfolioVelocity[index]?.currentRevenue ?? 0;

    return {
      label: point.label,
      portfolioShare: portfolioRevenue > 0 ? (point.currentRevenue / portfolioRevenue) * 100 : 0,
    };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
      <p className="flex justify-between gap-6">
        <span className="text-slate-500">Share:</span>
        <strong className="text-[#51B5B9]">{payload[0].value.toFixed(2)}%</strong>
      </p>
    </div>
  );
};

export function PortfolioRevenueShareTrajectoryChart({tenantVelocity, portfolioVelocity, className}: {
  tenantVelocity: FinancialVelocityPoint[]; portfolioVelocity: FinancialVelocityPoint[]; className?: string;
}) {
  const rows = buildRows(tenantVelocity, portfolioVelocity);

  return (
    <ChartPanel
      title="Portfolio Revenue Share Trajectory"
      className={className || ''}
      bodyClassName="w-full h-full flex flex-col flex-1 min-h-0"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => `${value.toFixed(2)}%`}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="portfolioShare"
            stroke="#51B5B9"
            strokeWidth={2}
            fill="#51B5B9"
            fillOpacity={0.15}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
