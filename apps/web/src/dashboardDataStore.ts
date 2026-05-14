import { useSyncExternalStore } from 'react';
import type {
  GlobalKpi,
  TenantKpi,
  DailyGlobalRollup,
} from '@types';

export const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export type Period = 1 | 7 | 30 | 90;

type DashboardDataSnapshot = {
  period: Period;
  loading: boolean;
  error: string | null;
  globalKpi: GlobalKpi | null;
  tenantKpis: TenantKpi[];
  globalRollups: DailyGlobalRollup[];
};

const listeners = new Set<() => void>();

let snapshot: DashboardDataSnapshot = {
  period: 30,
  loading: true,
  error: null,
  globalKpi: null,
  tenantKpis: [],
  globalRollups: [],
};

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let activeRequestId = 0;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return res.json() as Promise<T>;
}

async function loadDashboardData(days: Period) {
  const [globalKpi, tenantKpis, globalRollups] = await Promise.all([
    fetchJson<GlobalKpi>(`/api/dashboard/kpis/global?days=${days}`),
    fetchJson<TenantKpi[]>(`/api/dashboard/kpis/tenants?days=${days}`),
    fetchJson<DailyGlobalRollup[]>(`/api/dashboard/global-rollups?days=${days * 2}`),
  ]);
  return { globalKpi, tenantKpis, globalRollups };
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
      tenantKpis: data.tenantKpis,
      globalRollups: data.globalRollups,
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
