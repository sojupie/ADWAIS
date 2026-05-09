import { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import type {
  GlobalKpi,
  TenantKpi,
  DailyGlobalRollup,
} from '@types';
import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { KpiCard } from './components/KpiCard';
import { RevenueVelocityChart } from './components/RevenueVelocityChart';
import { GrowthExtremesChart } from './components/GrowthExtremesChart';
import { TenantRevenueTable } from './components/TenantRevenueTable';
import { StatusBar } from './components/StatusBar';

// ── Constants ─────────────────────────────────────────────────
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

type Period = 1 | 7 | 30 | 90;

// ── Data Fetching ─────────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

async function loadDashboardData(days: Period) {
  const [globalKpi, tenantKpis, globalRollups] = await Promise.all([
    fetchJson<GlobalKpi>(`/api/dashboard/kpis/global?days=${days}`),
    fetchJson<TenantKpi[]>(`/api/dashboard/kpis/tenants?days=${days}`),
    fetchJson<DailyGlobalRollup[]>(`/api/dashboard/global-rollups?days=${days * 2}`), // fetch 2× for prev period ghost
  ]);
  return { globalKpi, tenantKpis, globalRollups };
}

// ── Component ─────────────────────────────────────────────────
export default function App() {
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [globalKpi, setGlobalKpi] = useState<GlobalKpi | null>(null);
  const [tenantKpis, setTenantKpis] = useState<TenantKpi[]>([]);
  const [globalRollups, setGlobalRollups] = useState<DailyGlobalRollup[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (days: Period) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadDashboardData(days);
      setGlobalKpi(data.globalKpi);
      setTenantKpis(data.tenantKpis);
      setGlobalRollups(data.globalRollups);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + period change
  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchData(period), REFRESH_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [period, fetchData]);

  // Split rollups into current & previous period for the chart
  const sortedRollups = [...globalRollups].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );
  const currentRollups = sortedRollups.slice(0, period);
  const previousRollups = sortedRollups.slice(period, period * 2);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__logo">M</div>
          <div>
            <h1 className="dashboard__title">Motillo Dashboard</h1>
            <p className="dashboard__subtitle">Portfolio Diagnostics</p>
          </div>
        </div>

        <div className="dashboard__controls">
          {error && (
            <span className="dashboard__error">⚠ {error}</span>
          )}
          <div className="btn-group" role="group" aria-label="Time period selector">
            {([1, 7, 30, 90] as Period[]).map((d) => (
              <button
                key={d}
                id={`period-${d}`}
                className={period === d ? 'active' : ''}
                onClick={() => setPeriod(d)}
                aria-pressed={period === d}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="dashboard__main">
        {/* KPI row */}
        <section className="kpi-row" aria-label="Key Performance Indicators">
          <KpiCard
            label="Global Revenue"
            sublabel={`(${period}D)`}
            value={globalKpi ? formatCurrency(globalKpi.totalRevenue) : '—'}
            pop={globalKpi?.revenuePoP}
          />
          <KpiCard
            label="Transaction Volume"
            sublabel="Total absolute orders"
            value={globalKpi ? formatNumber(globalKpi.totalVolume) : '—'}
            pop={globalKpi?.volumePoP}
          />
          <KpiCard
            label="Portfolio AOV"
            sublabel="Derived (Revenue / Volume)"
            value={globalKpi ? formatCompact(globalKpi.aov) + ' SEK' : '—'}
            pop={globalKpi?.aovPoP}
          />
        </section>

        {/* Charts row */}
        <section className="charts-row" aria-label="Revenue charts">
          <div className="chart-slot chart-slot--velocity">
            {currentRollups.length > 0
              ? <RevenueVelocityChart current={currentRollups} previous={previousRollups} />
              : <SkeletonChart />}
          </div>
          <div className="chart-slot chart-slot--extremes">
            {tenantKpis.length > 0
              ? <GrowthExtremesChart tenants={tenantKpis} />
              : <SkeletonChart />}
          </div>
        </section>

        {/* Table */}
        <section className="table-row" aria-label="Client performance table">
          {tenantKpis.length > 0
            ? <TenantRevenueTable tenants={tenantKpis} />
            : <SkeletonTable />}
        </section>
      </main>

      {/* ── Status Bar ── */}
      <StatusBar
        lastUpdated={lastUpdated}
        loading={loading}
        refreshIntervalMs={REFRESH_INTERVAL_MS}
        onRefresh={() => fetchData(period)}
      />
    </div>
  );
}

// ── Skeleton Placeholders ─────────────────────────────────────
function SkeletonChart() {
  return (
    <div className="card skeleton-chart">
      <div className="skeleton-line skeleton-line--sm" />
      <div className="skeleton-block" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="card skeleton-table">
      <div className="skeleton-line skeleton-line--sm" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${90 - i * 8}%`, opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}
