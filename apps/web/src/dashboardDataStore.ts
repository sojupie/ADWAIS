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

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

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

type UptimeMonitorResponse = Omit<FleetMonitor, 'tenantName'>;

type MonitorAnalyticsResponse = {
  latencyPoints: LatencyPoint[];
  monitors: UptimeMonitorResponse[];
};

type FinancialVelocityResponsePoint = Omit<FinancialVelocityPoint, 'label' | 'timestamp'> & {
  label?: string;
  periodLabel?: string;
  timestamp?: string;
};

type CumulativeGrowthDeltaResponsePoint = Omit<CumulativeGrowthDeltaPoint, 'label' | 'timestamp'> & {
  label?: string;
  periodLabel?: string;
  timestamp?: string;
};

type FleetStatusSummary = {
  total: number;
  enabled: number;
  up: number;
  down: number;
  syncErrors: number;
  averageUptime: number;
};

type FinancialOverviewData = Pick<
  DashboardDataSnapshot,
  'globalKpi' | 'growthExtremes' | 'globalVelocity' | 'momentum' | 'distribution'
>;

type FleetStatusData = {
  monitors: FleetMonitor[];
  latencyPoints: LatencyPoint[];
};

const EMPTY_FLEET_SUMMARY: FleetStatusSummary = {
  total: 0,
  enabled: 0,
  up: 0,
  down: 0,
  syncErrors: 0,
  averageUptime: 0,
};

const INITIAL_SNAPSHOT: DashboardDataSnapshot = {
  period: 30,
  loading: true,
  error: null,
  fleetLoading: true,
  fleetError: null,
  fleetMonitors: [],
  fleetLatencyPoints: [],
  fleetSummary: EMPTY_FLEET_SUMMARY,
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

const api = {
  tenants: {
    list: '/api/tenants',
    byId: (tenantId: string) => `/api/tenants?id=${encodeURIComponent(tenantId)}`,
  },
  financial: {
    kpis: (query: string) => `/api/financial/kpis?${query}`,
    velocity: (query: string) => `/api/financial/velocity?${query}`,
    growthExtremes: (timeframe: Timeframe) => `/api/financial/growth-extremes?timeframe=${timeframe}`,
    distribution: (timeframe: Timeframe) => `/api/financial/distribution?timeframe=${timeframe}&topN=10`,
    momentum: (timeframe: Timeframe) => `/api/financial/momentum?timeframe=${timeframe}`,
    cumulativeGrowthDelta: (query: string) => `/api/financial/cumulative-growth-delta?${query}`,
    orderDistribution: (query: string) => `/api/financial/order-distribution?${query}`,
  },
  monitors: {
    analytics: (timeframe: Timeframe) => `/api/monitors/analytics?timeframe=${timeframe}`,
  },
};

const listeners = new Set<() => void>();

let snapshot = INITIAL_SNAPSHOT;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let activeFinancialRequestId = 0;
let activeTenantRequestId = 0;
let activeFleetRequestId = 0;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return res.json() as Promise<T>;
}

function getTimeframe(period: Period): Timeframe {
  return `T${period}`;
}

function financialQuery(timeframe: Timeframe, tenantId?: string): string {
  const params = new URLSearchParams({ timeframe });
  if (tenantId) params.set('tenantId', tenantId);
  return params.toString();
}

function getPointLabel(point: { label?: string; periodLabel?: string }, index: number): string {
  return point.label ?? point.periodLabel ?? `Day ${index + 1}`;
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

function mapVelocity(points: FinancialVelocityResponsePoint[]): FinancialVelocityPoint[] {
  return points.map((point, index) => ({
    ...point,
    label: getPointLabel(point, index),
    timestamp: point.timestamp ?? '',
  }));
}

function mapCumulativeGrowthDelta(
  points: CumulativeGrowthDeltaResponsePoint[],
): CumulativeGrowthDeltaPoint[] {
  return points.map((point, index) => ({
    ...point,
    label: getPointLabel(point, index),
    timestamp: point.timestamp ?? '',
  }));
}

function normalizeStatus(status?: string): string {
  return (status ?? 'Unknown').replaceAll('"', '').trim();
}

function buildFleetSummary(monitors: FleetMonitor[]): FleetStatusSummary {
  const enabled = monitors.filter((monitor) => monitor.uptimeMonitorEnabled).length;
  const up = monitors.filter((monitor) => normalizeStatus(monitor.currentStatus).toUpperCase() === 'UP').length;
  const enabledMonitors = monitors.filter((monitor) => monitor.uptimeMonitorEnabled);
  const averageUptime = enabledMonitors.length > 0
    ? enabledMonitors.reduce((total, monitor) => total + monitor.currentUptimePercentage, 0) / enabledMonitors.length
    : 0;

  return {
    total: monitors.length,
    enabled,
    up,
    down: enabled - up,
    syncErrors: monitors.filter((monitor) => monitor.lastSyncError).length,
    averageUptime,
  };
}

async function loadFinancialOverview(period: Period): Promise<FinancialOverviewData> {
  const timeframe = getTimeframe(period);
  const query = financialQuery(timeframe);
  const [kpi, growthExtremes, velocity, momentum, distribution] = await Promise.all([
    fetchJson<FinancialKpi>(api.financial.kpis(query)),
    fetchJson<GrowthExtreme[]>(api.financial.growthExtremes(timeframe)),
    fetchJson<FinancialVelocityResponsePoint[]>(api.financial.velocity(query)),
    fetchJson<MomentumResponse>(api.financial.momentum(timeframe)),
    fetchJson<DistributionEntry[]>(api.financial.distribution(timeframe)),
  ]);

  return {
    globalKpi: mapKpi(kpi),
    growthExtremes,
    globalVelocity: mapVelocity(velocity),
    momentum,
    distribution,
  };
}

async function loadTenantDiagnostics(tenantId: string, period: Period): Promise<TenantDiagnostics> {
  const timeframe = getTimeframe(period);
  const tenantQuery = financialQuery(timeframe, tenantId);
  const globalQuery = financialQuery(timeframe);

  const [tenants, kpi, velocity, portfolioVelocity, cumulativeGrowthDelta, orderDistribution] = await Promise.all([
    fetchJson<TenantResponse[]>(api.tenants.byId(tenantId)),
    fetchJson<FinancialKpi>(api.financial.kpis(tenantQuery)),
    fetchJson<FinancialVelocityResponsePoint[]>(api.financial.velocity(tenantQuery)),
    fetchJson<FinancialVelocityResponsePoint[]>(api.financial.velocity(globalQuery)),
    fetchJson<CumulativeGrowthDeltaResponsePoint[]>(api.financial.cumulativeGrowthDelta(tenantQuery)),
    fetchJson<OrderBin[]>(api.financial.orderDistribution(tenantQuery)),
  ]);
  const tenant = tenants[0];
  if (!tenant) throw new Error(`Tenant not found - ${tenantId}`);

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    days: period,
    totalRevenue: kpi.currentRevenue,
    totalVolume: kpi.transactionVolume,
    aov: kpi.averageOrderValue,
    previousRevenue: kpi.previousRevenue,
    previousVolume: 0,
    previousAov: 0,
    revenuePoP: kpi.revenueGrowthPercentage,
    volumePoP: 0,
    aovPoP: 0,
    velocity: mapVelocity(velocity),
    portfolioVelocity: mapVelocity(portfolioVelocity),
    cumulativeGrowthDelta: mapCumulativeGrowthDelta(cumulativeGrowthDelta),
    orderDistribution,
  };
}

async function loadMonitorAnalytics(period: Period): Promise<MonitorAnalyticsResponse> {
  return fetchJson<MonitorAnalyticsResponse>(api.monitors.analytics(getTimeframe(period)));
}

async function loadFleetStatus(period: Period): Promise<FleetStatusData> {
  const [analytics, tenants] = await Promise.all([
    loadMonitorAnalytics(period),
    fetchJson<TenantResponse[]>(api.tenants.list),
  ]);
  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  return {
    latencyPoints: analytics.latencyPoints,
    monitors: analytics.monitors
      .map((monitor) => ({
        ...monitor,
        lastSyncError: monitor.lastSyncError ?? null,
        tenantName: tenantNames.get(monitor.tenantId) ?? monitor.tenantId,
      }))
      .sort((a, b) => a.tenantName.localeCompare(b.tenantName) || a.name.localeCompare(b.name)),
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function updateSnapshot(next: Partial<DashboardDataSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function fetchFinancialData(period: Period) {
  const requestId = ++activeFinancialRequestId;
  updateSnapshot({ loading: true, error: null });

  try {
    const data = await loadFinancialOverview(period);
    if (requestId !== activeFinancialRequestId) return;
    updateSnapshot(data);
  } catch (error) {
    if (requestId !== activeFinancialRequestId) return;
    updateSnapshot({ error: errorMessage(error, 'Failed to fetch data') });
  } finally {
    if (requestId === activeFinancialRequestId) updateSnapshot({ loading: false });
  }
}

async function fetchTenantData(tenantId: string, period: Period) {
  const requestId = ++activeTenantRequestId;
  updateSnapshot({
    tenantDiagnostics: null,
    tenantDiagnosticsLoading: true,
    tenantDiagnosticsError: null,
  });

  try {
    const tenantDiagnostics = await loadTenantDiagnostics(tenantId, period);
    if (requestId !== activeTenantRequestId || snapshot.selectedTenantId !== tenantId) return;
    updateSnapshot({ tenantDiagnostics });
  } catch (error) {
    if (requestId !== activeTenantRequestId || snapshot.selectedTenantId !== tenantId) return;
    updateSnapshot({ tenantDiagnosticsError: errorMessage(error, 'Failed to fetch tenant diagnostics') });
  } finally {
    if (requestId === activeTenantRequestId && snapshot.selectedTenantId === tenantId) {
      updateSnapshot({ tenantDiagnosticsLoading: false });
    }
  }
}

async function fetchFleetData(period: Period) {
  const requestId = ++activeFleetRequestId;
  updateSnapshot({ fleetLoading: true, fleetError: null });

  try {
    const data = await loadFleetStatus(period);
    if (requestId !== activeFleetRequestId) return;
    updateSnapshot({
      fleetMonitors: data.monitors,
      fleetLatencyPoints: data.latencyPoints,
      fleetSummary: buildFleetSummary(data.monitors),
    });
  } catch (error) {
    if (requestId !== activeFleetRequestId) return;
    updateSnapshot({ fleetError: errorMessage(error, 'Failed to fetch fleet status') });
  } finally {
    if (requestId === activeFleetRequestId) updateSnapshot({ fleetLoading: false });
  }
}

function restartRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => void fetchFinancialData(snapshot.period), REFRESH_INTERVAL_MS);
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

export function setDashboardPeriod(period: Period) {
  if (period === snapshot.period) return;

  updateSnapshot({ period });
  void fetchFinancialData(period);
  void fetchFleetData(period);
  if (snapshot.selectedTenantId) void fetchTenantData(snapshot.selectedTenantId, period);
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

  if (tenantId) void fetchTenantData(tenantId, snapshot.period);
}

void fetchFinancialData(snapshot.period);
void fetchFleetData(snapshot.period);
restartRefreshTimer();

export function useDashboardData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
