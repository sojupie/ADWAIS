import { memo } from 'react';
import {
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { RevenueEfficiencyResponse, RevenueEfficiencyTenant, ComparisonPeriod } from '@types';
import { formatCompact, formatCurrency } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import {EmptyState} from "../common/ui/EmptyState.tsx";

const TYPE_COLORS: Record<string, string> = {
  'B2C': 'var(--color-chart-1)',
  'Mixed': 'var(--color-chart-2)',
  'B2B': 'var(--color-chart-3)',
};

const CustomTooltip = ({ active, payload }: { isLoading?: boolean;  active?: boolean; payload?: { payload: unknown }[] }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as RevenueEfficiencyTenant;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">
        {point.tenantName} <span className="text-slate-500 font-normal text-sm ml-2 uppercase tracking-wider">{point.type}</span>
      </p>
      <div className="space-y-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Average Order Value:</span>
          <strong className="text-slate-700">{formatCurrency(point.averageOrderValue)}</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Portfolio Share:</span>
          <strong className="text-slate-700">{point.portfolioSharePercentage.toFixed(1)}%</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Growth Velocity:</span>
          <strong className={point.growthVelocity >= 0 ? 'text-growth' : 'text-[#c92a2a]'}>
            {point.growthVelocity > 0 ? '+' : ''}{point.growthVelocity.toFixed(1)}%
          </strong>
        </p>
      </div>
    </div>
  );
};

export const RevenueEfficiencyChart = memo(function RevenueEfficiencyChart({
  isLoading, isStale, response,
  comparison,
  onTenantSelect,
  className }: { isLoading?: boolean; isStale?: boolean;
  response: RevenueEfficiencyResponse;
  comparison?: ComparisonPeriod;
  onTenantSelect?: (tenantId: string) => void;
  className?: string;
}) {
  const isEmpty = !response || response.tenants.length === 0;

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Revenue Efficiency Matrix"
      comparison={comparison}
      className={className || "h-full"}
      bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0'}
      legend={<span className="text-sm font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded">Size = Growth Velocity</span>}
    >
      {isEmpty ? (
        <EmptyState message={"No data available"} variant={"minimal"}/>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <XAxis
              type="number"
              dataKey="averageOrderValue"
              name="AOV"
              tickFormatter={(value) => formatCompact(value)}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Average Order Value (SEK) →',
                position: 'insideBottom',
                offset: -5,
                fill: 'var(--color-chart-label)',
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'Manrope, sans-serif'
              }}
            />
            <YAxis
              type="number"
              dataKey="portfolioSharePercentage"
              name="Portfolio Share"
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              tick={{ fill: 'var(--color-chart-tick)', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            {/* We map growthVelocity to bubble area. We take absolute value to ensure sizes are positive,
                but users still see negative growth via tooltip. */}
            <ZAxis type="number" dataKey="growthVelocity" range={[50, 1500]} name="Growth Velocity" />
            <ReferenceLine x={response.globalAverageOrderValue} stroke="var(--color-chart-prev-line)" strokeWidth={2} strokeDasharray="5 5" />
            <ReferenceLine y={response.medianPortfolioShare} stroke="var(--color-chart-prev-line)" strokeWidth={2} strokeDasharray="5 5" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} useTranslate3d={true} />
            <Scatter
              data={response.tenants.map(e => ({ ...e, absoluteGrowth: Math.abs(e.growthVelocity) }))}
              dataKey="absoluteGrowth"
              className={onTenantSelect ? 'cursor-pointer hover:opacity-90 transition-opacity' : undefined}
              fillOpacity={0.7}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
              onClick={(point) => {
                const payload = point?.payload as RevenueEfficiencyTenant | undefined;
                if (payload?.tenantId) {
                  onTenantSelect?.(payload.tenantId);
                }
              }}
            >
              {response.tenants.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type] || TYPE_COLORS['Mixed']} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
});
