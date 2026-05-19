import { useState } from 'react';
import './App.css';
import { useDashboardData } from './dashboardDataStore';
import { Financial, FinancialPeriodSelector } from './pages/Financial';
import { FleetStatus } from './pages/FleetStatus';

type DashboardView = 'financial' | 'Fleet Status' | 'Intranet';

export default function App() {
  const [view, setView] = useState<DashboardView>('financial');
  const { error } = useDashboardData();

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
          {view === 'financial' && <FinancialPeriodSelector />}
        </div>
      </header>
      <main className="dashboard__main">
        {view === 'financial' ? (
          <Financial />
        ) : view === 'Fleet Status' ? (
          <FleetStatus />
        ) : (
          <section className="dashboard-placeholder" aria-label="tba">
            <EmptyState title="in progress" />
          </section>
        )}
      </main>
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
