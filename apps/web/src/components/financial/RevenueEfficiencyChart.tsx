import { memo, useMemo } from 'react';
import type { BubbleDataPoint, ChartData, ChartDataset, ChartOptions } from 'chart.js';
import type { RevenueEfficiencyResponse, ComparisonPeriod } from '@types';
import { formatCompact, formatCurrency } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import { EmptyState } from '../common/ui/EmptyState';
import { chartColor, chartTick, chartTooltip, referenceLinesPlugin, scaleBubbleRadii, tenantInitialsPlugin } from '../common/charts/chartJs';
import { ChartJsCanvas } from '../common/charts/ChartJsCanvas';

const TYPE_COLORS: Record<string, [string, string]> = {
  B2C: ['--color-chart-1', '#0ea5e9'],
  Mixed: ['--color-chart-2', '#8b5cf6'],
  B2B: ['--color-chart-3', '#2563eb'],
};

export const RevenueEfficiencyChart = memo(function RevenueEfficiencyChart({
  isLoading, isStale, response, comparison, onTenantSelect, className,
}: {
  isLoading?: boolean; isStale?: boolean; response: RevenueEfficiencyResponse;
  comparison?: ComparisonPeriod; onTenantSelect?: (tenantId: string) => void; className?: string;
}) {
  const isEmpty = !response || response.tenants.length === 0;
  const radii = useMemo(() => scaleBubbleRadii(response.tenants.map(tenant => Math.abs(tenant.growthVelocity)), 5, 22), [response.tenants]);
  const points: BubbleDataPoint[] = response.tenants.map((tenant, index) => ({
    x: tenant.averageOrderValue,
    y: tenant.portfolioSharePercentage,
    r: radii[index],
  }));
  const dataset = {
    label: 'Tenants',
    data: points,
    backgroundColor: response.tenants.map(tenant => {
      const [variable, fallback] = TYPE_COLORS[tenant.type] || TYPE_COLORS.Mixed;
      return chartColor(variable, fallback) + 'B3';
    }),
    borderColor: '#fff',
    borderWidth: 2,
    hoverBorderWidth: 3,
    tenantMeta: response.tenants,
  } as ChartDataset<'bubble', BubbleDataPoint[]> & { tenantMeta: typeof response.tenants };
  const data: ChartData<'bubble'> = { datasets: [dataset] };
  const options: ChartOptions<'bubble'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    onClick: (_event, elements) => {
      const tenant = elements[0] ? response.tenants[elements[0].index] : undefined;
      if (tenant?.tenantId) onTenantSelect?.(tenant.tenantId);
    },
    onHover: (event, elements) => {
      if (event.native) (event.native.target as HTMLElement).style.cursor = elements.length ? 'pointer' : 'default';
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          title: items => response.tenants[items[0].dataIndex]?.tenantName || '',
          label: context => {
            const tenant = response.tenants[context.dataIndex];
            return [
              `Average Order Value: ${formatCurrency(tenant.averageOrderValue)}`,
              `Portfolio Share: ${tenant.portfolioSharePercentage.toFixed(1)}%`,
              `Growth Velocity: ${tenant.growthVelocity > 0 ? '+' : ''}${tenant.growthVelocity.toFixed(1)}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, title: { display: true, text: 'Average Order Value (SEK) →', color: chartColor('--color-chart-label', '#475569'), font: { family: 'Manrope, sans-serif', size: 14, weight: 800 } }, ticks: { ...chartTick(14), callback: value => formatCompact(Number(value)) } },
      y: { border: { display: false }, grid: { display: false }, title: { display: true, text: 'Share of portfolio (%) →', color: chartColor('--color-chart-label', '#475569'), font: { family: 'Manrope, sans-serif', size: 14, weight: 800 } }, ticks: { ...chartTick(14), callback: value => `${Number(value).toFixed(0)}%` } },
    },
  };

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale} title="Revenue Efficiency Matrix" comparison={comparison}
      className={className || 'h-full'} bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0'}
      legend={<span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded">Size = Relative Revenue Growth</span>}
    >
      {isEmpty ? <EmptyState message="No data available" variant="minimal" /> : (
        <div className="absolute inset-0"><ChartJsCanvas type="bubble" data={data} options={options} plugins={[referenceLinesPlugin(response.globalAverageOrderValue, response.medianPortfolioShare), tenantInitialsPlugin]} /></div>
      )}
    </ChartPanel>
  );
});
