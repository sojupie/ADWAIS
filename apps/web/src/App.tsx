import { useState } from 'react';
import './App.css';
import './components/financial/FinancialDashboard.css';
import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { LoadingIcon } from './components/common/LoadingIcon';
import { GrowthExtremesChart } from './components/financial/GrowthExtremesChart';
import { FactPanel } from './components/common/FactPanel';
import { RevenueVelocityChart } from './components/financial/RevenueVelocityChart';
import { UptimeDashboard } from './components/uptime/UptimeDashboard';
import { setDashboardPeriod, useDashboardData, type Period } from './dashboardDataStore';

type DashboardView = 'financial' | 'uptime' | 'Fleet Status' | 'Intranet';

export default function App() {
  const [view, setView] = useState<DashboardView>('financial');
  const { period, loading, error, globalKpi, tenantKpis, globalRollups } = useDashboardData();

  const sortedRollups = [...globalRollups].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );
  const currentRollups = sortedRollups.slice(0, period);
  const previousRollups = sortedRollups.slice(period, period * 2);

  return (
    <div className="dashboard">
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
            <span className="dashboard__error">{'\u26a0'} {error}</span>
          )}
          {view === 'financial' && (
            <div className="btn-group" role="group" aria-label="Time period selector">
              {([1, 7, 30, 90] as Period[]).map((d) => (
                <button
                  key={d}
                  id={`period-${d}`}
                  className={period === d ? 'active' : ''}
                  onClick={() => setDashboardPeriod(d)}
                  aria-pressed={period === d}
                >
                  {d}D
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="dashboard__main">
        {view === 'financial' ? (
          loading ? (
            <DashboardLoading />
          ) : (
            <>
              <section className="kpi-row" aria-label="Key Performance Indicators">
                <FactPanel
                  label="Global Revenue"
                  sublabel={`(${period}D)`}
                  value={globalKpi ? formatCurrency(globalKpi.totalRevenue) : '\u2014'}
                  pop={globalKpi?.revenuePoP}
                />
                <FactPanel
                  label="Transaction Volume"
                  sublabel="Total absolute orders"
                  value={globalKpi ? formatNumber(globalKpi.totalVolume) : '\u2014'}
                  pop={globalKpi?.volumePoP}
                />
                <FactPanel
                  label="Portfolio AOV"
                  sublabel="Derived (Revenue / Volume)"
                  value={globalKpi ? `${formatCompact(globalKpi.aov)} SEK` : '\u2014'}
                  pop={globalKpi?.aovPoP}
                />
              </section>

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
