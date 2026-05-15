import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { GrowthExtremesChart } from '../components/financial/GrowthExtremesChart';
import { RevenueVelocityChart } from '../components/financial/RevenueVelocityChart';
import { useDashboardData } from '../dashboardDataStore';
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
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="card empty-state">
      <span>{title}</span>
    </div>
  );
}
