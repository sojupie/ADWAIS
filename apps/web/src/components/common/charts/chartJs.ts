import {
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
  type Plugin,
} from 'chart.js';

ChartJS.register(
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  ScatterController,
  Tooltip,
);

export const CHART_FONT = 'Manrope, sans-serif';

export function chartColor(variable: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
}

export const chartTooltip = {
  backgroundColor: (context: { chart: { canvas: HTMLCanvasElement } }) =>
    getComputedStyle(context.chart.canvas).getPropertyValue('--color-surface').trim()
      || chartColor('--color-surface', '#fff'),
  titleColor: chartColor('--color-on-surface', '#1f2937'),
  bodyColor: chartColor('--color-on-surface-variant', '#64748b'),
  borderColor: chartColor('--color-outline-variant', '#e2e8f0'),
  borderWidth: 1,
  cornerRadius: 10,
  padding: 14,
  caretPadding: 10,
  boxPadding: 7,
  titleSpacing: 4,
  titleMarginBottom: 10,
  bodySpacing: 7,
  titleFont: { family: CHART_FONT, size: 16, weight: 'bold' as const },
  bodyFont: { family: CHART_FONT, size: 14, weight: 'bold' as const, lineHeight: 1.35 },
  displayColors: true,
  usePointStyle: true,
};

export function chartTick(fontSize = 12, fontWeight: 600 | 700 = 600) {
  return {
    color: chartColor('--color-chart-tick', '#64748b'),
    font: { family: CHART_FONT, size: fontSize, weight: fontWeight },
  };
}

export const chartLegendLabels = {
  ...chartTick(14, 600),
  usePointStyle: true,
  pointStyleWidth: 14,
  boxWidth: 9,
  boxHeight: 9,
  padding: 18,
};

export const horizontalGrid = {
  color: chartColor('--color-chart-grid', '#e2e8f0'),
  borderDash: [3, 4],
  drawTicks: false,
};

export function scaleBubbleRadii(values: number[], minRadius = 5, maxRadius = 20): number[] {
  const normalized = values.map(value => Math.sqrt(Math.max(0, value)));
  const min = Math.min(...normalized);
  const max = Math.max(...normalized);
  if (min === max) return normalized.map(() => (minRadius + maxRadius) / 2);
  return normalized.map(value => minRadius + ((value - min) / (max - min)) * (maxRadius - minRadius));
}

type TenantPointMeta = { tenantName?: string | null };

export const tenantInitialsPlugin: Plugin<'bubble'> = {
  id: 'tenantInitials',
  afterDatasetsDraw(chart) {
    const context = chart.ctx;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const tenantMeta = (dataset as typeof dataset & { tenantMeta?: TenantPointMeta[] }).tenantMeta;
      if (!tenantMeta) return;
      const elements = chart.getDatasetMeta(datasetIndex).data;
      elements.forEach((element, index) => {
        const name = tenantMeta[index]?.tenantName;
        const radius = (dataset.data[index] as { r?: number } | undefined)?.r ?? 0;
        if (!name || radius < 7) return;
        context.save();
        context.fillStyle = '#fff';
        context.font = `800 ${Math.max(9, radius * 0.9)}px ${CHART_FONT}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name.charAt(0).toUpperCase(), element.x, element.y);
        context.restore();
      });
    });
  },
};

export function referenceLinesPlugin(xValue?: number, yValue?: number): Plugin<'bubble'> {
  return {
    id: `referenceLines-${xValue ?? 'none'}-${yValue ?? 'none'}`,
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      ctx.save();
      ctx.strokeStyle = chartColor('--color-chart-prev-line', '#94a3b8');
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      if (xValue != null) {
        const x = scales.x.getPixelForValue(xValue);
        ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke();
      }
      if (yValue != null) {
        const y = scales.y.getPixelForValue(yValue);
        ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
      }
      ctx.restore();
    },
  };
}
