import { useSyncExternalStore } from 'react';
import type {
  FinancialKpi,
  FinancialVelocityPoint,
  GlobalKpi,
  GrowthExtreme,
  MomentumResponse,
} from '@types';

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export type Period = 7 | 30 | 90;
type Timeframe = `T${Period}`;

type DashboardDataSnapshot = {
  period: Period;
  loading: boolean;
  error: string | null;
  globalKpi: GlobalKpi | null;
  growthExtremes: GrowthExtreme[];
  globalVelocity: FinancialVelocityPoint[];
  momentum: MomentumResponse | null;
};

const listeners = new Set<() => void>();

let snapshot: DashboardDataSnapshot = {
  period: 30,
  loading: true,
  error: null,
  globalKpi: null,
  growthExtremes: [],
  globalVelocity: [],
  momentum: null,
};

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let activeRequestId = 0;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
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

async function loadDashboardData(days: Period) {
  const timeframe = getTimeframe(days);
  const [globalKpi, growthExtremes, globalVelocity, momentum] = await Promise.all([
    fetchJson<FinancialKpi>(`/api/financial/kpis?timeframe=${timeframe}`),
    fetchJson<GrowthExtreme[]>(`/api/financial/growth-extremes?timeframe=${timeframe}`),
    fetchJson<FinancialVelocityPoint[]>(`/api/financial/velocity?timeframe=${timeframe}`),
    fetchJson<MomentumResponse>(`/api/financial/momentum?timeframe=${timeframe}`),
  ]);
  return {
    globalKpi: mapKpi(globalKpi),
    growthExtremes,
    globalVelocity,
    momentum,
  };
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
  restartRefreshTimer();
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
restartRefreshTimer();

export function useDashboardData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
