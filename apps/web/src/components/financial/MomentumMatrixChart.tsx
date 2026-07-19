import { memo, useMemo } from 'react';
import type { BubbleDataPoint, ChartData, ChartDataset, ChartOptions } from 'chart.js';
import type { MomentumResponse, ComparisonPeriod } from '@types';
import { formatCompact, formatNumber } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import { EmptyState } from '../common/ui/EmptyState';
import { chartColor, chartTick, createHtmlTooltip, horizontalGrid, matrixQuadrantsPlugin, referenceLinesPlugin, scaleBubbleRadii, tenantMarkerPlugin } from '../common/charts/chartJs';
import { ChartJsCanvas } from '../common/charts/ChartJsCanvas';

const TYPE_COLORS: Record<string, [string, string]> = {
  B2C: ['--color-chart-1', '#0ea5e9'],
  Mixed: ['--color-chart-2', '#8b5cf6'],
  B2B: ['--color-chart-3', '#2563eb'],
};

export const MomentumMatrixChart = memo(function MomentumMatrixChart({ isLoading, isStale, momentum, comparison, onTenantSelect, className }: {
  isLoading?: boolean; isStale?: boolean; momentum: MomentumResponse; comparison?: ComparisonPeriod;
  onTenantSelect?: (tenantId: string) => void; className?: string;
}) {
  const points = momentum.tenants;
  const isEmpty = points.length === 0;
  const radii = useMemo(() => scaleBubbleRadii(points.map(point => point.orderVolume), 6, 20), [points]);
  const bubbles: BubbleDataPoint[] = points.map((point, index) => ({ x: point.baselineRevenue, y: point.growthPercentage, r: radii[index] }));
  const dataset = {
    label: 'Tenants',
    data: bubbles,
    backgroundColor: points.map(point => {
      const [variable, fallback] = TYPE_COLORS[point.type] || TYPE_COLORS.Mixed;
      return chartColor(variable, fallback) + 'B3';
    }),
    borderColor: '#fff', borderWidth: 2, hoverBorderWidth: 3, tenantMeta: points,
  } as ChartDataset<'bubble', BubbleDataPoint[]> & { tenantMeta: typeof points };
  const data: ChartData<'bubble'> = { datasets: [dataset] };
  const options: ChartOptions<'bubble'> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    onClick: (_event, elements) => {
      const tenant = elements[0] ? points[elements[0].index] : undefined;
      if (tenant?.tenantId) onTenantSelect?.(tenant.tenantId);
    },
    onHover: (event, elements) => {
      if (event.native) (event.native.target as HTMLElement).style.cursor = elements.length ? 'pointer' : 'default';
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: createHtmlTooltip(tooltip => {
          const point = points[tooltip.dataPoints[0]?.dataIndex];
          if (!point) return null;
          const [typeVariable, typeFallback] = TYPE_COLORS[point.type] || TYPE_COLORS.Mixed;
          return {
            title: point.tenantName,
            tag: { label: point.type, color: chartColor(typeVariable, typeFallback) },
            groups: [
              [
                { label: 'Current Revenue', value: formatCompact(point.currentRevenue) },
                { label: 'Order Volume', value: formatNumber(point.orderVolume) },
              ],
              [{
                label: 'Momentum',
                value: `${point.growthPercentage > 0 ? '+' : ''}${point.growthPercentage.toFixed(1)}%`,
                tone: point.growthPercentage > 0 ? 'positive' : point.growthPercentage < 0 ? 'negative' : 'default',
              }],
            ],
          };
        }),
      },
    },
    scales: {
      x: { border: { display: false }, grid: horizontalGrid, title: { display: true, text: 'Revenue (SEK) →', color: chartColor('--color-chart-label', '#475569'), font: { family: 'Manrope, sans-serif', size: 14, weight: 800 } }, ticks: { ...chartTick(14), callback: value => formatCompact(Number(value)) } },
      y: { border: { display: false }, grid: horizontalGrid, title: { display: true, text: 'Revenue growth (%) →', color: chartColor('--color-chart-label', '#475569'), font: { family: 'Manrope, sans-serif', size: 14, weight: 800 } }, ticks: { ...chartTick(14), callback: value => `${Number(value).toFixed(0)}%` } },
    },
  };

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale} title="Momentum Matrix" comparison={comparison}
      className={className || 'h-full'} bodyClassName={isEmpty ? 'flex items-center justify-center' : 'flex-1 min-h-0'}
      legend={<span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded">Size = Order Volume</span>}
    >
      {isEmpty ? <EmptyState message="No previous-period baseline data" variant="minimal" /> : (
        <div className="absolute inset-0"><ChartJsCanvas type="bubble" data={data} options={options} plugins={[matrixQuadrantsPlugin(momentum.medianBaselineRevenue, momentum.globalGrowthPercentage), referenceLinesPlugin(momentum.medianBaselineRevenue, momentum.globalGrowthPercentage), tenantMarkerPlugin]} /></div>
      )}
    </ChartPanel>
  );
});
