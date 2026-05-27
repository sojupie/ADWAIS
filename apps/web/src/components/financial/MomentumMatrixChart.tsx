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
} from 'recharts';
import type { MomentumResponse, MomentumTenant } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as MomentumTenant;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{point.tenantName}</p>
      <div className="space-y-2">
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Baseline:</span>
          <strong className="text-slate-700">{formatCompact(point.baselineRevenue)} SEK</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Current:</span>
          <strong className="text-slate-700">{formatCompact(point.currentRevenue)} SEK</strong>
        </p>
        <p className="flex justify-between gap-6">
          <span className="text-slate-500">Momentum:</span>
          <strong className={point.growthPercentage >= 0 ? 'text-growth' : 'text-decline'}>
            {point.growthPercentage.toFixed(1)}%
          </strong>
        </p>
      </div>
    </div>
  );
};

function MomentumScatterPlot({ points, medianBaselineRevenue, onTenantSelect }: { 
points: MomentumTenant[]; medianBaselineRevenue: number; onTenantSelect?: (tenantId: string) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
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
            value: 'P30 Baseline Revenue →',
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
        <ReferenceLine y={0} stroke="var(--color-chart-prev-line)" strokeWidth={2} strokeDasharray="5 5" />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter
          data={points}
          className={onTenantSelect ? 'cursor-pointer hover:opacity-90 transition-opacity' : undefined}
          fill="var(--color-brand-btn-primary)"
          fillOpacity={0.7}
          stroke="#fff"
          strokeWidth={2}
          onClick={(point) => {
            const payload = point?.payload as MomentumTenant | undefined;

            if (payload?.tenantId) {
              onTenantSelect?.(payload.tenantId);
            }
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function MomentumMatrixChart({ momentum, onTenantSelect, className }: { 
momentum: MomentumResponse; onTenantSelect?: (tenantId: string) => void; className?: string; })
{
  const points = momentum.tenants;
  const isEmpty = points.length === 0;

  return (
    <ChartPanel
      title="Momentum Matrix"
      className={className || "h-full"}
      bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0'}
      legend={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded">Size = Total Rev Contribution</span>}
    >
      {isEmpty ? (
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">No previous-period baseline data</span>
      ) : (
        <MomentumScatterPlot
          points={points}
          medianBaselineRevenue={momentum.medianBaselineRevenue}
          onTenantSelect={onTenantSelect}
        />
      )}
    </ChartPanel>
  );
}
