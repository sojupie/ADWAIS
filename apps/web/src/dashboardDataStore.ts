import { useSyncExternalStore } from 'react';
import type {
  CumulativeGrowthDeltaPoint,
  DistributionEntry,
  FinancialKpi,
  FinancialVelocityPoint,
  GlobalKpi,
  GrowthExtreme,
  MomentumResponse,
  OrderBin,
  TenantDiagnostics,
} from '@types';
import type { FleetMonitor } from './components/FleetStatus/FleetMatrix';
import type { LatencyPoint } from './components/FleetStatus/NetworkLatencyChart';

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export type Period = 7 | 30 | 90;
type Timeframe = `T${Period}`;

type DashboardDataSnapshot = {
  period: Period;
  loading: boolean;
  error: string | null;
  fleetLoading: boolean;
  fleetError: string | null;
  fleetMonitors: FleetMonitor[];
  fleetLatencyPoints: LatencyPoint[];
  fleetSummary: FleetStatusSummary;
  selectedTenantId: string | null;
  tenantDiagnostics: TenantDiagnostics | null;
  tenantDiagnosticsLoading: boolean;
  tenantDiagnosticsError: string | null;
  globalKpi: GlobalKpi | null;
  growthExtremes: GrowthExtreme[];
  globalVelocity: FinancialVelocityPoint[];
  momentum: MomentumResponse | null;
  distribution: DistributionEntry[];
};

type TenantResponse = {
  id: string;
  name: string;
};

type UptimeMonitor = {
  id: number;
  tenantId: string;
  name: string;
  url: string;
  uptimeSla: number | null;
  uptimeMonitorEnabled: boolean;
  currentStatus: string;
  currentUptimePercentage: number;
};

type LatencyMetricsResponse = {
  date: string;
  average: number | null;
  lowest: number | null;
  highest: number | null;
};

type FleetStatusSummary = {
  total: number;
  enabled: number;
  up: number;
  down: number;
  averageUptime: number | null;
};

const emptyFleetSummary: FleetStatusSummary = {
  total: 0,
  enabled: 0,
  up: 0,
  down: 0,
  averageUptime: null,
};

const listeners = new Set<() => void>();

let snapshot: DashboardDataSnapshot = {
  period: 30,
  loading: true,
  error: null,
  fleetLoading: true,
  fleetError: null,
  fleetMonitors: [],
  fleetLatencyPoints: [],
  fleetSummary: emptyFleetSummary,
  selectedTenantId: null,
  tenantDiagnostics: null,
  tenantDiagnosticsLoading: false,
  tenantDiagnosticsError: null,
  globalKpi: null,
  growthExtremes: [],
  globalVelocity: [],
  momentum: null,
  distribution: [],
};

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let activeRequestId = 0;
let activeTenantRequestId = 0;
let activeFleetRequestId = 0;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return res.json() as Promise<T>;
}

function getTimeframe(days: Period): Timeframe {
  return `T${days}`;
}

function mapKpi(kpi: FinancialKpi): GlobalKpi {
  return {
    totalRevenue: kpi.currentRevenue,
    totalVolume: kpi.transactionVolume,
    aov: kpi.averageOrderValue,
    previousRevenue: kpi.previousRevenue,
    previousVolume: 0,
    previousAov: 0,
    revenuePoP: kpi.revenueGrowthPercentage,
    volumePoP: 0,
    aovPoP: 0,
  };
}

function normalizeStatus(status?: string): string {
  return (status ?? 'Unknown').replaceAll('"', '').trim();
}

function buildFleetSummary(monitors: FleetMonitor[]): FleetStatusSummary {
  const enabled = monitors.filter((monitor) => monitor.uptimeMonitorEnabled).length;
  const up = monitors.filter((monitor) => normalizeStatus(monitor.currentStatus).toUpperCase() === 'UP').length;
  const down = enabled - up;
  const uptimeValues = monitors
    .map((monitor) => monitor.currentUptimePercentage)
    .filter((value): value is number => typeof value === 'number');
  const averageUptime = uptimeValues.length === 0
    ? null
    : uptimeValues.reduce((total, value) => total + value, 0) / uptimeValues.length;

  return {
    total: monitors.length,
    enabled,
    up,
    down,
    averageUptime,
  };
}

async function loadDashboardData(days: Period) {
  const timeframe = getTimeframe(days);
  const [globalKpi, growthExtremes, globalVelocity, momentum, distribution] = await Promise.all([
    fetchJson<FinancialKpi>(`/api/financial/kpis?timeframe=${timeframe}`),
    fetchJson<GrowthExtreme[]>(`/api/financial/growth-extremes?timeframe=${timeframe}`),
    fetchJson<FinancialVelocityPoint[]>(`/api/financial/velocity?timeframe=${timeframe}`),
    fetchJson<MomentumResponse>(`/api/financial/momentum?timeframe=${timeframe}`),
    fetchJson<DistributionEntry[]>(`/api/financial/distribution?timeframe=${timeframe}&topN=10`),
  ]);
  return {
    globalKpi: mapKpi(globalKpi),
    growthExtremes,
    globalVelocity,
    momentum,
    distribution,
  };
}

async function loadTenantDiagnostics(tenantId: string, days: Period): Promise<TenantDiagnostics> {
  const timeframe = getTimeframe(days);
  const tenantQuery = `timeframe=${timeframe}&tenantId=${encodeURIComponent(tenantId)}`;
  const [tenant, kpi, velocity, portfolioVelocity, cumulativeGrowthDelta, orderDistribution] = await Promise.all([
    fetchJson<TenantResponse>(`/api/tenants/${tenantId}`),
    fetchJson<FinancialKpi>(`/api/financial/kpis?${tenantQuery}`),
    fetchJson<FinancialVelocityPoint[]>(`/api/financial/velocity?${tenantQuery}`),
    fetchJson<FinancialVelocityPoint[]>(`/api/financial/velocity?timeframe=${timeframe}`),
    fetchJson<CumulativeGrowthDeltaPoint[]>(`/api/financial/cumulative-growth-delta?${tenantQuery}`),
    fetchJson<OrderBin[]>(`/api/financial/order-distribution?${tenantQuery}`),
  ]);

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    days,
    totalRevenue: kpi.currentRevenue,
    totalVolume: kpi.transactionVolume,
    aov: kpi.averageOrderValue,
    previousRevenue: kpi.previousRevenue,
    previousVolume: 0,
    previousAov: 0,
    revenuePoP: kpi.revenueGrowthPercentage,
    volumePoP: 0,
    aovPoP: 0,
    velocity,
    portfolioVelocity,
    cumulativeGrowthDelta,
    orderDistribution,
  };
}

async function loadFleetMonitors(): Promise<FleetMonitor[]> {
  const [monitors, tenants] = await Promise.all([
    fetchJson<UptimeMonitor[]>('/api/monitors'),
    fetchJson<TenantResponse[]>('/api/tenants'),
  ]);
  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  return monitors
    .map((monitor) => ({
      ...monitor,
      tenantName: tenantNames.get(monitor.tenantId) ?? monitor.tenantId,
    }))
    .sort((a, b) => a.tenantName.localeCompare(b.tenantName) || a.name.localeCompare(b.name));
}

async function loadFleetLatencySeries(monitors: FleetMonitor[]): Promise<LatencyPoint[]> {
  const enabledMonitors = monitors.filter((monitor) => monitor.uptimeMonitorEnabled);
  if (enabledMonitors.length === 0) return [];

  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const query = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

  const responses = await Promise.all(
    enabledMonitors.map(async (monitor) => {
      const metrics = await fetchJson<LatencyMetricsResponse[]>(
        `/api/monitors/${monitor.id}/latency?${query}&tenantId=${encodeURIComponent(monitor.tenantId)}`,
      ).catch(() => []);

      return metrics
        .filter((metric) => metric.average !== null)
        .map((metric) => ({
          date: metric.date,
          average: metric.average as number,
        }));
    }),
  );

  const buckets = new Map<string, number[]>();

  responses.flat().forEach((metric) => {
    const date = new Date(metric.date);
    date.setMinutes(0, 0, 0);
    const key = date.toISOString();
    const values = buckets.get(key) ?? [];
    values.push(metric.average);
    buckets.set(key, values);
  });

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({
      periodLabel: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      averageLatency: average(values),
      p95Latency: percentile(values, 0.95),
    }));
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function emit() {
  listeners.forEach((listener) => listener());
}

function updateSnapshot(next: Partial<DashboardDataSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

async function fetchData(days: Period) {
  const requestId = ++activeRequestId;
  updateSnapshot({ loading: true, error: null });

  try {
    const data = await loadDashboardData(days);
    if (requestId !== activeRequestId) return;

    updateSnapshot({
      globalKpi: data.globalKpi,
      growthExtremes: data.growthExtremes,
      globalVelocity: data.globalVelocity,
      momentum: data.momentum,
      distribution: data.distribution,
    });
  } catch (e) {
    if (requestId !== activeRequestId) return;
    updateSnapshot({ error: e instanceof Error ? e.message : 'Failed to fetch data' });
  } finally {
    if (requestId === activeRequestId) {
      updateSnapshot({ loading: false });
    }
  }
}

async function fetchTenantData(tenantId: string, days: Period) {
  const requestId = ++activeTenantRequestId;
  updateSnapshot({
    tenantDiagnostics: null,
    tenantDiagnosticsLoading: true,
    tenantDiagnosticsError: null,
  });

  try {
    const tenantDiagnostics = await loadTenantDiagnostics(tenantId, days);
    if (requestId !== activeTenantRequestId || snapshot.selectedTenantId !== tenantId) return;

    updateSnapshot({ tenantDiagnostics });
  } catch (e) {
    if (requestId !== activeTenantRequestId || snapshot.selectedTenantId !== tenantId) return;
    updateSnapshot({
      tenantDiagnosticsError: e instanceof Error ? e.message : 'Failed to fetch tenant diagnostics',
    });
  } finally {
    if (requestId === activeTenantRequestId && snapshot.selectedTenantId === tenantId) {
      updateSnapshot({ tenantDiagnosticsLoading: false });
    }
  }
}

async function fetchFleetData() {
  const requestId = ++activeFleetRequestId;
  updateSnapshot({ fleetLoading: true, fleetError: null });

  try {
    const fleetMonitors = await loadFleetMonitors();
    if (requestId !== activeFleetRequestId) return;

    updateSnapshot({
      fleetMonitors,
      fleetSummary: buildFleetSummary(fleetMonitors),
    });

    const fleetLatencyPoints = await loadFleetLatencySeries(fleetMonitors);
    if (requestId !== activeFleetRequestId) return;

    updateSnapshot({ fleetLatencyPoints });
  } catch (e) {
    if (requestId !== activeFleetRequestId) return;
    updateSnapshot({ fleetError: e instanceof Error ? e.message : 'Failed to fetch fleet status' });
  } finally {
    if (requestId === activeFleetRequestId) {
      updateSnapshot({ fleetLoading: false });
    }
  }
}

function restartRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    void fetchData(snapshot.period);
  }, REFRESH_INTERVAL_MS);
}

export function setDashboardPeriod(period: Period) {
  if (period === snapshot.period) return;

  updateSnapshot({ period });
  void fetchData(period);
  if (snapshot.selectedTenantId) {
    void fetchTenantData(snapshot.selectedTenantId, period);
  }
  restartRefreshTimer();
}

export function selectDashboardTenant(tenantId: string | null) {
  activeTenantRequestId++;

  updateSnapshot({
    selectedTenantId: tenantId,
    tenantDiagnostics: null,
    tenantDiagnosticsLoading: Boolean(tenantId),
    tenantDiagnosticsError: null,
  });

  if (tenantId) {
    void fetchTenantData(tenantId, snapshot.period);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

void fetchData(snapshot.period);
void fetchFleetData();
restartRefreshTimer();

export function useDashboardData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
