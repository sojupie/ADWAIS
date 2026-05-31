import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GrowthExtreme } from '@types';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';

const formatGrowth = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const CustomTooltip = ({ active, payload }: { isLoading?: boolean;  active?: boolean; payload?: { payload: unknown }[] }) => {
  if (!active || !payload?.length) return null;

  const tenant = payload[0].payload as GrowthExtreme;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{tenant.tenantName}</p>
      <div className="space-y-2">
        <p className="flex justify-between gap-6 text-slate-500">
          <span>Growth:</span>
          <strong className={tenant.growthPercentage >= 0 ? 'text-growth' : 'text-[#c92a2a]'}>
            {formatGrowth(tenant.growthPercentage)}
          </strong>
        </p>
        <p className="flex justify-between gap-6 text-slate-500">
          <span>Current:</span>
          <strong className="text-slate-700">{formatCompact(tenant.currentRevenue)} SEK</strong>
        </p>
        <p className="flex justify-between gap-6 text-slate-500">
          <span>Variance:</span>
          <strong className="text-slate-700">{formatCompact(tenant.absoluteVariance)} SEK</strong>
        </p>
      </div>
    </div>
  );
};

export function GrowthExtremesChart({ isLoading, tenants, onTenantSelect }: { isLoading?: boolean; 
  tenants: GrowthExtreme[]; onTenantSelect?: (tenantId: string) => void;
}) {
  if (tenants.length === 0) return null;

  const maxAbsGrowth = Math.max(
    1,
    ...tenants.map((tenant) => Math.abs(tenant.growthPercentage)),
  );
  const chartHeight = Math.max(280, tenants.length * 30);

  return (
    <ChartPanel isLoading={isLoading} title="Growth Extremes (Relative & Absolute)" bodyClassName="extremes-chart">
      <ResponsiveContainer debounce={50} width="100%" height={chartHeight}>
        <BarChart
          data={tenants}
          layout="vertical"
          margin={{ top: 6, right: 28, left: 8, bottom: 18 }}
        >
          <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" horizontal={false} />
          <XAxis
            type="number"
            domain={[-maxAbsGrowth, maxAbsGrowth]}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tick={{ fill: 'var(--color-chart-tick)', fontSize: 13, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="tenantName"
            width={120}
            tick={{ fill: 'var(--color-chart-label)', fontSize: 14, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="var(--color-chart-prev-line)" strokeWidth={2} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar
            dataKey="growthPercentage"
            className={onTenantSelect ? 'cursor-pointer hover:opacity-90 transition-opacity' : undefined}
            radius={[0, 4, 4, 0]}
            barSize={20}
            onClick={(row) => {
              const payload = row?.payload as GrowthExtreme | undefined;

              if (payload?.tenantId) {
                onTenantSelect?.(payload.tenantId);
              }
            }}
          >
            {tenants.map((tenant) => (
              <Cell
                key={tenant.tenantId}
                fill={tenant.growthPercentage < 0 ? 'var(--color-status-down)' : 'var(--color-status-up)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
