import { memo, useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import type { AccumulatedRevenuePointDto, ComparisonPeriod } from '@types';
import { ChartPanel } from '../common/charts/ChartPanel';
import { formatCurrency, formatChartLabel, inferBinSize, formatCompact } from '@utils';
import { EmptyState } from '../common/ui/EmptyState';
import { chartColor, chartLegendLabels, chartTick, chartTooltip, horizontalGrid } from '../common/charts/chartJs';
import { ChartJsCanvas } from '../common/charts/ChartJsCanvas';

interface AccumulatedRevenueChartProps {
  isLoading?: boolean;
  isStale?: boolean;
  points: AccumulatedRevenuePointDto[];
  comparison?: ComparisonPeriod;
  className?: string;
}

type MixedChart = 'bar' | 'line';

export const AccumulatedRevenueChart = memo(function AccumulatedRevenueChart({ isLoading, isStale, points, comparison, className }: AccumulatedRevenueChartProps) {
  const chartData = useMemo(() => {
    const binSize = inferBinSize(points.map(point => point.timestamp), false);
    return points.map((point, index) => ({
      ...point,
      label: formatChartLabel(point.timestamp, binSize, index),
    }));
  }, [points]);

  const data: ChartData<MixedChart, (number | null)[], string> = {
    labels: chartData.map(point => point.label),
    datasets: [
      {
        type: 'bar',
        label: 'Current Revenue',
        data: chartData.map(point => point.currentRevenue),
        yAxisID: 'left',
        backgroundColor: chartColor('--color-brand-btn-primary', '#2563eb') + '40',
        borderRadius: 4,
        maxBarThickness: 20,
        categoryPercentage: 0.9,
        barPercentage: 0.82,
        borderSkipped: false,
      },
      {
        type: 'line',
        label: 'Previous Accumulated',
        data: chartData.map(point => point.previousAccumulated),
        yAxisID: 'right',
        borderColor: chartColor('--color-chart-prev-line', '#94a3b8'),
        borderWidth: 2,
        borderDash: [4, 4],
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: chartColor('--color-chart-prev-line', '#94a3b8'),
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.3,
      },
      {
        type: 'line',
        label: 'Current Accumulated',
        data: chartData.map(point => point.currentAccumulated),
        yAxisID: 'right',
        borderColor: chartColor('--color-brand-btn-primary', '#2563eb'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: chartColor('--color-brand-btn-primary', '#2563eb'),
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<MixedChart> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 10, right: 4 } },
    plugins: {
      legend: { position: 'bottom', labels: chartLegendLabels },
      tooltip: {
        ...chartTooltip,
        callbacks: { label: context => `${context.dataset.label}: ${formatCurrency(Number(context.raw))}` },
      },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, ticks: { ...chartTick(14), autoSkip: true, maxRotation: 0 } },
      left: { position: 'left', border: { display: false }, grid: horizontalGrid, ticks: { ...chartTick(14), callback: value => formatCompact(Number(value)) } },
      right: { position: 'right', border: { display: false }, grid: { display: false }, ticks: { ...chartTick(14), callback: value => formatCompact(Number(value)) } },
    },
  };

  return (
    <ChartPanel isLoading={isLoading} isStale={isStale}
      title="Revenue Performance"
      comparison={comparison}
      className={className}
      bodyClassName={points.length === 0 ? 'flex items-center justify-center' : ''}
      legend={<span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded">L = Current rev, R = Accumulated Rev</span>}
    >
      {points.length === 0 ? (
        <EmptyState message="No revenue data available" variant="minimal" />
      ) : (
        <div className="absolute inset-0"><ChartJsCanvas type="bar" data={data} options={options} /></div>
      )}
    </ChartPanel>
  );
});
