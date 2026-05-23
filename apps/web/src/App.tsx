import { useState } from 'react';
import './App.css';
import { useDashboardData } from './dashboardDataStore';
import { Financial, FinancialPeriodSelector } from './pages/Financial';
import { FleetStatus } from './pages/FleetStatus';
import { Intranet } from './pages/Intranet';
import motilloLogo from './assets/motillo-logo.svg';

type NavbarPage = 'Financial' | 'Fleet-Status' | 'Intranet';

const NavbarPages: { id: NavbarPage; label: string }[] = [
  { id: 'Financial', label: 'Financial' },
  { id: 'Fleet-Status', label: 'Fleet Status' },
  { id: 'Intranet', label: 'Intranet' },
];

export default function App() {
  const [view, setView] = useState<NavbarPage>('Financial');
  const { error } = useDashboardData();

  return (
      <div className="dashboard">
        <header className="dashboard__header">
          <div className="dashboard__brand">
              <img
                  className="dashboard__logo"
                  src={motilloLogo}
                  alt="Motillo"
              />
          </div>

            
            
          <nav className="dashboard-nav" aria-label="Dashboard sections">
            {NavbarPages.map(({ id, label }) => (
                <button
                    key={id}
                    className={view === id ? 'active' : ''}
                    onClick={() => setView(id)}
                    aria-current={view === id ? 'page' : undefined}
                >
                  {label}
                </button>
            ))}
          </nav>
            
            
            
          <div className="dashboard__controls">
            {error && <span className="dashboard__error">⚠ {error}</span>}
            {view === 'Financial' && <FinancialPeriodSelector />}
          </div>
        </header>

          
          
        <main className="dashboard__main">
          {view === 'Financial' && <Financial />}
          {view === 'Fleet-Status' && <FleetStatus />}
          {view === 'Intranet' && <Intranet />}
        </main>
      </div>
  );
}