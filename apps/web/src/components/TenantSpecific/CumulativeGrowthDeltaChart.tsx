import { memo, useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import type { CumulativeGrowthDeltaPoint, ComparisonPeriod } from '@types';
import { formatChartLabel, inferBinSize, formatCompact } from '@utils';
import { ChartPanel } from '../common/charts/ChartPanel';
import { ChartJsCanvas } from '../common/charts/ChartJsCanvas';
import { chartColor, chartTick, createHtmlTooltip, horizontalGrid } from '../common/charts/chartJs';

export const CumulativeGrowthDeltaChart = memo(function CumulativeGrowthDeltaChart({ isLoading, isStale, points, comparison, className }: {
  isLoading?: boolean; isStale?: boolean; points: CumulativeGrowthDeltaPoint[]; comparison?: ComparisonPeriod; className?: string;
}) {
  const chartData = useMemo(() => {
    const binSize = inferBinSize(points.map(point => point.timestamp), points.length > 0 && points.length <= 24);
    return points.map((point, index) => ({ ...point, label: formatChartLabel(point.timestamp, binSize, index) }));
  }, [points]);
  const data: ChartData<'line', number[], string> = {
    labels: chartData.map(point => point.label),
    datasets: [{ label: 'Cumulative Growth Delta', data: chartData.map(point => point.cumulativeGrowthDelta), borderColor: chartColor('--color-brand-btn-primary', '#2563eb'), borderWidth: 2.4, pointRadius: 0, pointHoverRadius: 7, pointHoverBackgroundColor: chartColor('--color-brand-btn-primary', '#2563eb'), pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3, stepped: 'after' }],
  };
  const options: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: createHtmlTooltip(tooltip => {
          const point = chartData[tooltip.dataPoints[0]?.dataIndex];
          if (!point) return null;
          return {
            title: point.label,
            groups: [
              [
                { label: 'Current Cumulative', value: `${formatCompact(point.currentCumulative)} SEK`, tone: 'primary' },
                { label: 'Previous Cumulative', value: `${formatCompact(point.previousCumulative)} SEK`, tone: 'muted' },
              ],
              [{
                label: 'Delta',
                value: `${point.cumulativeGrowthDelta > 0 ? '+' : ''}${formatCompact(point.cumulativeGrowthDelta)} SEK`,
                tone: point.cumulativeGrowthDelta > 0 ? 'positive' : point.cumulativeGrowthDelta < 0 ? 'negative' : 'default',
              }],
            ],
          };
        }),
      },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, ticks: { ...chartTick(14, 700), autoSkip: true, maxRotation: 0 } },
      y: { border: { display: false }, grid: horizontalGrid, ticks: { ...chartTick(14), callback: value => `${Number(value) > 0 ? '+' : ''}${formatCompact(Math.abs(Number(value)))}` } },
    },
  };
  return (
    <ChartPanel isLoading={isLoading} isStale={isStale} title="Cumulative Growth Delta (Absolute)" comparison={comparison} className={className || ''}>
      <div className="absolute inset-0"><ChartJsCanvas type="line" data={data} options={options} /></div>
    </ChartPanel>
  );
});
