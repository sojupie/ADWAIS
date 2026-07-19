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
  LogarithmicScale,
  PointElement,
  ScatterController,
  Tooltip,
  type Plugin,
} from 'chart.js';
import { getTenantFaviconUrl } from '../../../utils/tenantHelper';

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
  LogarithmicScale,
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

type TenantPointMeta = {
  tenantName?: string | null;
  litiumBaseUrl?: string | null;
  url?: string | null;
};

type FaviconCacheEntry = {
  image: HTMLImageElement;
  status: 'loading' | 'loaded' | 'failed';
  waitingCharts: Set<ChartJS<'bubble'>>;
};

const chartFaviconCache = new Map<string, FaviconCacheEntry>();
const pendingFaviconRedraws = new Set<ChartJS<'bubble'>>();
let faviconRedrawFrame: number | null = null;

function scheduleFaviconRedraw(chart: ChartJS<'bubble'>) {
  pendingFaviconRedraws.add(chart);
  if (faviconRedrawFrame !== null) return;
  faviconRedrawFrame = requestAnimationFrame(() => {
    pendingFaviconRedraws.forEach(pendingChart => {
      const canvas = pendingChart.canvas;
      if (canvas && ChartJS.getChart(canvas) === pendingChart) pendingChart.draw();
    });
    pendingFaviconRedraws.clear();
    faviconRedrawFrame = null;
  });
}

function getChartFavicon(url: string, chart: ChartJS<'bubble'>): FaviconCacheEntry {
  const cached = chartFaviconCache.get(url);
  if (cached) {
    if (cached.status === 'loading') cached.waitingCharts.add(chart);
    return cached;
  }

  const image = new Image();
  const entry: FaviconCacheEntry = {
    image,
    status: 'loading',
    waitingCharts: new Set([chart]),
  };
  const redrawWaitingCharts = () => {
    entry.waitingCharts.forEach(scheduleFaviconRedraw);
    entry.waitingCharts.clear();
  };
  image.onload = () => {
    entry.status = 'loaded';
    redrawWaitingCharts();
  };
  image.onerror = () => {
    entry.status = 'failed';
    redrawWaitingCharts();
  };
  image.decoding = 'async';
  image.src = url;
  chartFaviconCache.set(url, entry);
  return entry;
}

export const tenantMarkerPlugin: Plugin<'bubble'> = {
  id: 'tenantMarkers',
  afterDatasetsDraw(chart) {
    const context = chart.ctx;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const tenantMeta = (dataset as typeof dataset & { tenantMeta?: TenantPointMeta[] }).tenantMeta;
      if (!tenantMeta) return;
      const elements = chart.getDatasetMeta(datasetIndex).data;
      elements.forEach((element, index) => {
        const tenant = tenantMeta[index];
        const name = tenant?.tenantName;
        const radius = (dataset.data[index] as { r?: number } | undefined)?.r ?? 0;
        if (radius < 5) return;
        const faviconUrl = getTenantFaviconUrl(tenant?.litiumBaseUrl || tenant?.url);
        const favicon = faviconUrl ? getChartFavicon(faviconUrl, chart) : null;

        context.save();
        if (favicon?.status === 'loaded') {
          const imageSize = radius * 1.5;
          context.beginPath();
          context.arc(element.x, element.y, Math.max(1, radius - 2), 0, Math.PI * 2);
          context.clip();
          context.globalAlpha = 0.7;
          context.globalCompositeOperation = 'luminosity';
          context.drawImage(
            favicon.image,
            element.x - imageSize / 2,
            element.y - imageSize / 2,
            imageSize,
            imageSize,
          );
        } else if (name && radius >= 7) {
          context.fillStyle = '#fff';
          context.font = `800 ${Math.max(9, radius * 0.9)}px ${CHART_FONT}`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(name.charAt(0).toUpperCase(), element.x, element.y);
        }
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

export function matrixQuadrantsPlugin(xValue: number, yValue: number): Plugin<'bubble'> {
  return {
    id: `matrixQuadrants-${xValue}-${yValue}`,
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x || !scales.y) return;

      const splitX = Math.min(chartArea.right, Math.max(chartArea.left, scales.x.getPixelForValue(xValue)));
      const splitY = Math.min(chartArea.bottom, Math.max(chartArea.top, scales.y.getPixelForValue(yValue)));
      const quadrants = [
        { color: 'rgba(59, 130, 246, 0.045)', x: chartArea.left, y: chartArea.top, width: splitX - chartArea.left, height: splitY - chartArea.top },
        { color: 'rgba(34, 197, 94, 0.05)', x: splitX, y: chartArea.top, width: chartArea.right - splitX, height: splitY - chartArea.top },
        { color: 'rgba(239, 68, 68, 0.035)', x: chartArea.left, y: splitY, width: splitX - chartArea.left, height: chartArea.bottom - splitY },
        { color: 'rgba(245, 158, 11, 0.045)', x: splitX, y: splitY, width: chartArea.right - splitX, height: chartArea.bottom - splitY },
      ];

      ctx.save();
      quadrants.forEach(quadrant => {
        ctx.fillStyle = quadrant.color;
        ctx.fillRect(quadrant.x, quadrant.y, quadrant.width, quadrant.height);
      });
      ctx.restore();
    },
  };
}
