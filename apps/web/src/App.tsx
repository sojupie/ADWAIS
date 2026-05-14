import { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import './components/financial/FinancialDashboard.css';
import type {
  GlobalKpi,
  TenantKpi,
  DailyGlobalRollup,
} from '@types';
import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { LoadingIcon } from './components/common/LoadingIcon';
import { GrowthExtremesChart } from './components/financial/GrowthExtremesChart';
import { FactPanel } from './components/common/FactPanel';
import { RevenueVelocityChart } from './components/financial/RevenueVelocityChart';
import { UptimeDashboard } from './components/uptime/UptimeDashboard';

// ── Constants ─────────────────────────────────────────────────
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

type Period = 1 | 7 | 30 | 90;
type DashboardView = 'financial' | 'uptime' |'Fleet Status' | 'Intranet' | 'TenantSpecific';

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
  const [view, setView] = useState<DashboardView>('financial');
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <img
            className="dashboard__logo"
            src="https://www.motillo.se/media/4ejbcxx1/motillo_utanpayoff.svg?mode=pad&width=140&height=0&upscale=false&rnd=132573678104400000"
            alt="Motillo"
          />
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard sections">
          <button
            className={view === 'financial' ? 'active' : ''}
            onClick={() => setView('financial')}
            aria-current={view === 'financial' ? 'page' : undefined}
          >
            Financial
          </button>
          <button
            className={view === 'uptime' ? 'active' : ''}
            onClick={() => setView('uptime')}
            aria-current={view === 'uptime' ? 'page' : undefined}
          >
            Uptime
          </button>
          <button
              className={view === 'Fleet Status' ? 'active' : ''}
              onClick={() => setView('Fleet Status')}
              aria-current={view === 'Fleet Status' ? 'page' : undefined}
          >
            Fleet Status
          </button>
          <button
              className={view === 'Intranet' ? 'active' : ''}
              onClick={() => setView('Intranet')}
              aria-current={view === 'Intranet' ? 'page' : undefined}
          >
            Intranet
          </button>
        </nav>

        <div className="dashboard__controls">
          {error && (
            <span className="dashboard__error">⚠ {error}</span>
          )}
          {view === 'financial' && (
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
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="dashboard__main">
        {view === 'financial' ? (
          loading ? (
            <DashboardLoading />
          ) : (
            <>
        {/* KPI row */}
        <section className="kpi-row" aria-label="Key Performance Indicators">
          <FactPanel
            label="Global Revenue"
            sublabel={`(${period}D)`}
            value={globalKpi ? formatCurrency(globalKpi.totalRevenue) : '—'}
            pop={globalKpi?.revenuePoP}
          />
          <FactPanel
            label="Transaction Volume"
            sublabel="Total absolute orders"
            value={globalKpi ? formatNumber(globalKpi.totalVolume) : '—'}
            pop={globalKpi?.volumePoP}
          />
          <FactPanel
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
                : <EmptyState title="No revenue data" />}
          </div>
          <div className="chart-slot chart-slot--extremes">
            {tenantKpis.length > 0
                ? <GrowthExtremesChart tenants={tenantKpis} />
                : <EmptyState title="No tenant data" />}
          </div>
        </section>

            </>
          )
        ) : view === 'uptime' ? (
          <UptimeDashboard />
        ) : (
          <section className="dashboard-placeholder" aria-label="tba">
            <EmptyState title="in progress" />
          </section>
            
        )}
      </main>

    </div>
  );
}

// ── Skeleton Placeholders ─────────────────────────────────────
function DashboardLoading() {
  return (
    <div className="dashboard-loading">
      <LoadingIcon />
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="card empty-state">
      <span>{title}</span>
    </div>
  );
}
