import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { GrowthExtremesChart } from '../components/financial/GrowthExtremesChart';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueDistributionChart } from '../components/financial/RevenueDistributionChart';
import { RevenueVelocityChart } from '../components/financial/RevenueVelocityChart';
import { TenantDiagnostics } from './TenantDiagnostics';
import {
  selectDashboardTenant,
  setDashboardPeriod,
  useDashboardData,
  type Period,
} from '../dashboardDataStore';
import './Financial.css';

export function Financial() {
  const {
    period,
    loading,
    selectedTenantId,
    tenantDiagnostics,
    tenantDiagnosticsLoading,
    tenantDiagnosticsError,
    globalKpi,
    growthExtremes,
    globalVelocity,
    momentum,
    distribution,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingIcon />
      </div>
    );
  }

  if (selectedTenantId) {
    if (tenantDiagnosticsError) {
      return (
        <div className="card empty-state">
          <span>{tenantDiagnosticsError}</span>
          <button type="button" onClick={() => selectDashboardTenant(null)}>Back</button>
        </div>
      );
    }

    if (tenantDiagnosticsLoading || !tenantDiagnostics) {
      return (
        <div className="dashboard-loading">
          <LoadingIcon />
        </div>
      );
    }

    return (
      <TenantDiagnostics
        data={tenantDiagnostics}
        onBack={() => selectDashboardTenant(null)}
      />
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
            ? { type: 'Desc', value: "Total absolute orders\n" }
            : undefined}
        />
        <FactPanel
          label="Portfolio AOV"
          value={globalKpi ? `${formatCompact(globalKpi.aov)} SEK` : '\u2014'}
          extra={globalKpi?.aovPoP !== undefined
            ? { type: 'Desc', value: "Derived (Revenue / Volume)\n" }
            : undefined}
        />
      </section>

      <section className="charts-row" aria-label="Revenue charts">
        <div className="chart-slot">
          {globalVelocity.length > 0
            ? <RevenueVelocityChart points={globalVelocity} />
            : <EmptyState title="No revenue data" />}
        </div>
        <div className="chart-slot">
          {growthExtremes.length > 0
            ? <GrowthExtremesChart tenants={growthExtremes} onTenantSelect={selectDashboardTenant} />
            : <EmptyState title="No tenant data" />}
        </div>
      </section>

      <section className="charts-row charts-row--analysis" aria-label="Portfolio analysis charts">
        <div className="chart-slot">
          {distribution.length > 0
            ? <RevenueDistributionChart entries={distribution} onTenantSelect={selectDashboardTenant} />
            : <EmptyState title="No tenant revenue data" />}
        </div>
        <div className="chart-slot">
          {momentum && momentum.tenants.length > 0
            ? <MomentumMatrixChart momentum={momentum} onTenantSelect={selectDashboardTenant} />
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
      {([7, 30, 90] as Period[]).map((d) => (
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
