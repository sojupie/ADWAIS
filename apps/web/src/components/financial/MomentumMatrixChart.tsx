import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell
} from 'recharts';
import type { MomentumResponse, MomentumTenant } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import {EmptyState} from "../common/ui/EmptyState.tsx";



const CustomTooltip = ({ active, payload }: { isLoading?: boolean;  active?: boolean; payload?: { payload: unknown }[] }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as MomentumTenant;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <div className="border-b border-slate-50 pb-2 mb-3 flex justify-between items-center">
        <p className="font-bold text-slate-900">{point.tenantName}</p>
        <span 
          className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-widest text-white ${
            point.type === 'B2C' ? 'bg-[#0ea5e9]' : 
            point.type === 'Mixed' ? 'bg-[#8b5cf6]' : 
            'bg-[var(--color-brand-btn-primary)]'
          }`}
        >
          {point.type}
        </span>
      </div>
      <div className="space-y-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Current Revenue:</span>
          <strong className="text-slate-700">{formatCompact(point.currentRevenue)}</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Momentum:</span>
          <strong className={point.growthPercentage >= 0 ? 'text-growth' : 'text-[#c92a2a]'}>
            {point.growthPercentage > 0 ? '+' : ''}{point.growthPercentage.toFixed(1)}%
          </strong>
        </p>
      </div>
    </div>
  );
};

function MomentumScatterPlot({ points, medianBaselineRevenue, globalGrowthPercentage, onTenantSelect }: { isLoading?: boolean;  
points: MomentumTenant[]; medianBaselineRevenue: number; globalGrowthPercentage: number; onTenantSelect?: (tenantId: string) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" debounce={150}>
      <ScatterChart margin={{ top: 10, right: 24, left: 12, bottom: 14 }}>
        <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" />
        <XAxis
          type="number"
          dataKey="baselineRevenue"
          name="Previous Baseline Revenue"
          tickFormatter={(value) => formatCompact(value)}
          tick={{ fill: 'var(--color-chart-tick)', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Revenue (SEK)→',
            position: 'insideBottom',
            offset: -3,
            fill: 'var(--color-chart-label)',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: 'Manrope, sans-serif'
          }}
        />
        <YAxis
          type="number"
          dataKey="growthPercentage"
          name="Revenue Momentum"
          tickFormatter={(value) => `${value.toFixed(0)}%`}
          tick={{ fill: 'var(--color-chart-tick)', fontSize: 13, fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <ZAxis type="number" dataKey="currentRevenue" range={[120, 1200]} />
        <ReferenceLine x={medianBaselineRevenue} stroke="var(--color-chart-prev-line)" strokeWidth={2} strokeDasharray="5 5" />
        <ReferenceLine y={globalGrowthPercentage} stroke="var(--color-chart-prev-line)" strokeWidth={2} strokeDasharray="5 5" />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} useTranslate3d={true} />
        <Scatter
          data={points}
          className={onTenantSelect ? 'cursor-pointer hover:opacity-90 transition-opacity' : undefined}
          fill="var(--color-brand-btn-primary)"
          fillOpacity={0.7}
          stroke="#fff"
          strokeWidth={2}
          isAnimationActive={false}
          onClick={(point) => {
            const payload = point?.payload as MomentumTenant | undefined;

            if (payload?.tenantId) {
              onTenantSelect?.(payload.tenantId);
            }
          }}
        >
          {points.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.type === 'B2B'
                  ? 'var(--color-chart-3)'
                  : entry.type === 'B2C'
                  ? 'var(--color-chart-1)'
                  : 'var(--color-chart-2)'
              }
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function MomentumMatrixChart({ isLoading, isStale, momentum, onTenantSelect, className }: { isLoading?: boolean; isStale?: boolean;  
momentum: MomentumResponse; onTenantSelect?: (tenantId: string) => void; className?: string; })
{
  const points = momentum.tenants;
  const isEmpty = points.length === 0;

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Momentum Matrix"
      className={className || "h-full"}
      bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0'}
      legend={<span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded">Size = Total Rev Contribution</span>}
    >
      {isEmpty ? (
        <EmptyState message={"No previous-period baseline data"} variant={"minimal"}/>
      ) : (
        <MomentumScatterPlot
          points={points}
          medianBaselineRevenue={momentum.medianBaselineRevenue}
          globalGrowthPercentage={momentum.globalGrowthPercentage}
          onTenantSelect={onTenantSelect}
        />
      )}
    </ChartPanel>
  );
}
