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
  type ChartType,
  type Plugin,
  type TooltipModel,
} from 'chart.js';
import { getTenantFaviconUrl } from '../../../utils/tenantHelper';

const htmlTooltips = new WeakMap<object, HTMLDivElement>();
const activeTooltipElements = new Set<HTMLDivElement>();

export const htmlTooltipPlugin: Plugin = {
  id: 'htmlTooltipCleanup',
  beforeDestroy(chart) {
    const element = htmlTooltips.get(chart);
    if (element) {
      element.remove();
      activeTooltipElements.delete(element);
      htmlTooltips.delete(chart);
    }
  },
};

if (typeof document !== 'undefined') {
  const dismissTooltips = (e: Event) => {
    if (e.type === 'pointerdown') {
      const target = e.target as HTMLElement | null;
      if (target?.closest('canvas') || target?.closest('.chartjs-html-tooltip')) return;
    }
    activeTooltipElements.forEach((element) => {
      if (element.isConnected) {
        element.style.opacity = '0';
      } else {
        activeTooltipElements.delete(element);
      }
    });
  };
  document.addEventListener('pointerdown', dismissTooltips, true);
  document.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape') dismissTooltips(e);
  });
}

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
  htmlTooltipPlugin,
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
  padding: { x: 16, y: 12 },
  caretPadding: 10,
  boxPadding: 7,
  titleSpacing: 4,
  titleMarginBottom: 4,
  bodySpacing: 7,
  titleFont: { family: CHART_FONT, size: 16, weight: 'bold' as const },
  bodyFont: { family: CHART_FONT, size: 14, weight: 'bold' as const, lineHeight: 1.35 },
  displayColors: true,
  usePointStyle: true,
};

export type ChartTooltipTone = 'default' | 'primary' | 'positive' | 'negative' | 'warning' | 'muted';

export type ChartTooltipRow = {
  label: string;
  value: string;
  tone?: ChartTooltipTone;
};

export type ChartTooltipContent = {
  title: string;
  tag?: { label: string; color?: string };
  groups: ChartTooltipRow[][];
};

const tooltipToneColor = (tone: ChartTooltipTone | undefined): string => {
  switch (tone) {
    case 'primary': return chartColor('--color-brand-btn-primary', '#0f766e');
    case 'positive': return chartColor('--color-success', '#16a34a');
    case 'negative': return chartColor('--color-error', '#ef4444');
    case 'warning': return chartColor('--color-warning', '#f97316');
    case 'muted': return chartColor('--color-on-surface-variant', '#64748b');
    default: return chartColor('--color-on-surface', '#1f2937');
  }
};

function getHtmlTooltip<TType extends ChartType>(chart: ChartJS<TType>): HTMLDivElement {
  const existing = htmlTooltips.get(chart);
  if (existing?.isConnected) return existing;

  const element = document.createElement('div');
  element.classList.add('chartjs-html-tooltip');
  Object.assign(element.style, {
    position: 'absolute',
    zIndex: '30',
    minWidth: '230px',
    maxWidth: 'min(300px, calc(100% - 16px))',
    padding: '12px 16px',
    border: `1px solid ${chartColor('--color-outline-variant', '#e2e8f0')}`,
    borderRadius: '10px',
    background: chartColor('--color-surface', '#fff'),
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.13)',
    color: chartColor('--color-on-surface', '#1f2937'),
    fontFamily: CHART_FONT,
    fontSize: '14px',
    lineHeight: '1.35',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 80ms ease',
  });
  chart.canvas.parentElement?.appendChild(element);
  htmlTooltips.set(chart, element);
  activeTooltipElements.add(element);
  return element;
}

function renderHtmlTooltip(element: HTMLDivElement, content: ChartTooltipContent) {
  element.replaceChildren();

  const header = document.createElement('div');
  Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '4px' });
  const title = document.createElement('strong');
  title.textContent = content.title;
  Object.assign(title.style, { flex: '1', minWidth: '0', fontSize: '14px', fontWeight: '800' });
  header.appendChild(title);
  if (content.tag) {
    const tag = document.createElement('span');
    tag.textContent = content.tag.label;
    Object.assign(tag.style, {
      flexShrink: '0', padding: '2px 7px', borderRadius: '4px', color: '#fff',
      background: content.tag.color || chartColor('--color-on-surface-variant', '#64748b'),
      fontSize: '10px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase',
    });
    header.appendChild(tag);
  }
  element.appendChild(header);

  content.groups.filter(group => group.length > 0).forEach((group, groupIndex) => {
    const groupElement = document.createElement('div');
    Object.assign(groupElement.style, {
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: '18px', rowGap: '7px',
      paddingTop: groupIndex === 0 ? '0' : '11px',
      marginTop: groupIndex === 0 ? '0' : '10px',
      borderTop: groupIndex === 0 ? 'none' : `1px solid ${chartColor('--color-outline-variant', '#e2e8f0')}`,
    });
    group.forEach(row => {
      const label = document.createElement('span');
      label.textContent = row.label;
      Object.assign(label.style, { color: chartColor('--color-on-surface-variant', '#64748b'), fontWeight: '500' });
      const value = document.createElement('strong');
      value.textContent = row.value;
      Object.assign(value.style, {
        color: tooltipToneColor(row.tone), fontWeight: '750', textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      });
      groupElement.append(label, value);
    });
    element.appendChild(groupElement);
  });
}

export function createHtmlTooltip<TType extends ChartType>(
  getContent: (tooltip: TooltipModel<TType>) => ChartTooltipContent | null,
) {
  return ({ chart, tooltip }: { chart: ChartJS<TType>; tooltip: TooltipModel<TType> }) => {
    const element = getHtmlTooltip(chart);
    if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
      element.style.opacity = '0';
      return;
    }

    const content = getContent(tooltip);
    if (!content) {
      element.style.opacity = '0';
      return;
    }
    renderHtmlTooltip(element, content);
    element.style.opacity = '1';

    const parent = chart.canvas.parentElement;
    if (!parent) return;
    const margin = 8;
    const preferredLeft = chart.canvas.offsetLeft + tooltip.caretX + 14;
    const tooltipWidth = element.offsetWidth;
    const tooltipHeight = element.offsetHeight;
    const left = preferredLeft + tooltipWidth <= parent.clientWidth - margin
      ? preferredLeft
      : chart.canvas.offsetLeft + tooltip.caretX - tooltipWidth - 14;
    const preferredTop = chart.canvas.offsetTop + tooltip.caretY - tooltipHeight / 2;
    element.style.left = `${Math.max(margin, Math.min(left, parent.clientWidth - tooltipWidth - margin))}px`;
    element.style.top = `${Math.max(margin, Math.min(preferredTop, parent.clientHeight - tooltipHeight - margin))}px`;
  };
}

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
