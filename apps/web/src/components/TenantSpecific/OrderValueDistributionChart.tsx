import { memo } from 'react';
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import type { OrderBin } from '@types';
import { formatNumber } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import { ChartJsCanvas } from '../common/charts/ChartJsCanvas';
import { chartColor, chartLegendLabels, chartTick, chartTooltip, horizontalGrid } from '../common/charts/chartJs';

type MixedChart = 'bar' | 'line';

const thresholdLines: Plugin<MixedChart> = {
  id: 'distributionThresholds',
  beforeDatasetsDraw(chart) {
    const scale = chart.scales.right;
    if (!scale) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = '#ef444499';
    ctx.setLineDash([3, 3]);
    [70, 80].forEach(value => {
      const y = scale.getPixelForValue(value);
      ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
    });
    ctx.restore();
  },
};

export const OrderValueDistributionChart = memo(function OrderValueDistributionChart({ isLoading, isStale, bins, className }: {
  isLoading?: boolean; isStale?: boolean; bins: OrderBin[]; className?: string;
}) {
  const data: ChartData<MixedChart, number[], string> = {
    labels: bins.map(bin => bin.binLabel),
    datasets: [
      { type: 'bar', label: 'Volume (Orders)', data: bins.map(bin => bin.orderCount), yAxisID: 'left', backgroundColor: chartColor('--color-brand-btn-primary', '#2563eb') + '99', borderRadius: 4, maxBarThickness: 60 },
      { type: 'line', label: 'Density Curve', data: bins.map(bin => bin.kdeDensity), yAxisID: 'left', borderColor: '#0d9488', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 7, pointHoverBackgroundColor: '#0d9488', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3, tension: 0.35 },
      { type: 'line', label: 'Cumulative %', data: bins.map(bin => bin.cumulativePercentage), yAxisID: 'right', borderColor: '#f97316', borderWidth: 2, borderDash: [4, 4], pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#f97316', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, tension: 0.35 },
    ],
  };
  const options: ChartOptions<MixedChart> = {
    responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 12, bottom: 4 } },
    plugins: {
      legend: { position: 'bottom', labels: chartLegendLabels },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          title: items => bins[items[0].dataIndex]?.binLabel || '',
          label: context => context.datasetIndex === 0
            ? `Volume: ${formatNumber(Number(context.raw))}`
            : context.datasetIndex === 1
              ? `Density (KDE): ${formatNumber(Number(context.raw))}`
              : `Cumulative: ${Number(context.raw).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, ticks: { ...chartTick(14, 700), autoSkip: true, maxTicksLimit: 8, sampleSize: 8, minRotation: 0, maxRotation: 45, padding: 6 } },
      left: { position: 'left', border: { display: false }, grid: horizontalGrid, ticks: chartTick(14, 700) },
      right: { position: 'right', min: 0, max: 100, border: { display: false }, grid: { display: false }, ticks: { ...chartTick(14, 700), color: '#f97316', callback: value => `${value}%` } },
    },
  };
  return (
    <ChartPanel isLoading={isLoading} isStale={isStale} title="Order Distribution & Shipping Threshold" className={className || ''}>
      <div className="absolute inset-0"><ChartJsCanvas type="bar" data={data} options={options} plugins={[thresholdLines]} /></div>
    </ChartPanel>
  );
});
