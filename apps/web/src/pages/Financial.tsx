import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { GrowthExtremesChart } from '../components/financial/GrowthExtremesChart';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueDistributionChart } from '../components/financial/RevenueDistributionChart';
import { RevenueVelocityChart } from '../components/financial/RevenueVelocityChart';
import { setDashboardPeriod, useDashboardData, type Period } from '../dashboardDataStore';
import './Financial.css';

export function Financial() {
  const { period, loading, globalKpi, tenantKpis, globalRollups } = useDashboardData();

  const sortedRollups = [...globalRollups].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );
  const currentRollups = sortedRollups.slice(0, period);
  const previousRollups = sortedRollups.slice(period, period * 2);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <>
      <section className="kpi-row" aria-label="Key Performance Indicators">
        <FactPanel
          label={`Global Revenue (${period}D)`}
          value={globalKpi ? formatCurrency(globalKpi.totalRevenue) : '\u2014'}
          extra={globalKpi?.revenuePoP !== undefined
            ? { type: 'PoP', value: globalKpi.revenuePoP }
            : undefined}
        />
        <FactPanel
          label="Transaction Volume"
          value={globalKpi ? formatNumber(globalKpi.totalVolume) : '\u2014'}
          extra={globalKpi?.volumePoP !== undefined
            ? { type: 'PoP', value: globalKpi.volumePoP }
            : undefined}
        />
        <FactPanel
          label="Portfolio AOV"
          value={globalKpi ? `${formatCompact(globalKpi.aov)} SEK` : '\u2014'}
          extra={globalKpi?.aovPoP !== undefined
            ? { type: 'PoP', value: globalKpi.aovPoP }
            : undefined}
        />
      </section>

      <section className="charts-row" aria-label="Revenue charts">
        <div className="chart-slot">
          {currentRollups.length > 0
            ? <RevenueVelocityChart current={currentRollups} previous={previousRollups} />
            : <EmptyState title="No revenue data" />}
        </div>
        <div className="chart-slot">
          {tenantKpis.length > 0
            ? <GrowthExtremesChart tenants={tenantKpis} />
            : <EmptyState title="No tenant data" />}
        </div>
      </section>

      <section className="charts-row charts-row--analysis" aria-label="Portfolio analysis charts">
        <div className="chart-slot">
          {tenantKpis.length > 0
            ? <RevenueDistributionChart tenants={tenantKpis} />
            : <EmptyState title="No tenant revenue data" />}
        </div>
        <div className="chart-slot">
          {tenantKpis.length > 0
            ? <MomentumMatrixChart tenants={tenantKpis} />
            : <EmptyState title="No tenant momentum data" />}
        </div>
      </section>
    </>
  );
}

export function FinancialPeriodSelector() {
  const { period } = useDashboardData();

  return (
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
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="card empty-state">
      <span>{title}</span>
    </div>
  );
}
