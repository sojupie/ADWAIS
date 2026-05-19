import { useEffect, useState } from 'react';
import { formatCurrency, formatCompact, formatNumber } from '@utils';
import type { TenantDiagnostics as TenantDiagnosticsData } from '@types';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { GrowthExtremesChart } from '../components/financial/GrowthExtremesChart';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueDistributionChart } from '../components/financial/RevenueDistributionChart';
import { RevenueVelocityChart } from '../components/financial/RevenueVelocityChart';
import { useDashboardData } from '../dashboardDataStore';
import { TenantDiagnostics } from './TenantDiagnostics';
import './Financial.css';

export function Financial() {
  const { period, loading, globalKpi, tenantKpis, globalRollups } = useDashboardData();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantDiagnostics, setTenantDiagnostics] = useState<TenantDiagnosticsData | null>(null);
  const [tenantDiagnosticsLoading, setTenantDiagnosticsLoading] = useState(false);
  const [tenantDiagnosticsError, setTenantDiagnosticsError] = useState<string | null>(null);

  const sortedRollups = [...globalRollups].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );
  const currentRollups = sortedRollups.slice(0, period);
  const previousRollups = sortedRollups.slice(period, period * 2);

  useEffect(() => {
    if (!selectedTenantId) {
      setTenantDiagnostics(null);
      setTenantDiagnosticsError(null);
      setTenantDiagnosticsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchTenantDiagnostics() {
      setTenantDiagnosticsLoading(true);
      setTenantDiagnosticsError(null);

      try {
        const response = await fetch(
          `/api/dashboard/tenants/${selectedTenantId}/diagnostics?days=${period}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as TenantDiagnosticsData;
        setTenantDiagnostics(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setTenantDiagnosticsError(error instanceof Error ? error.message : 'Failed to fetch tenant diagnostics');
      } finally {
        if (!controller.signal.aborted) {
          setTenantDiagnosticsLoading(false);
        }
      }
    }

    void fetchTenantDiagnostics();

    return () => controller.abort();
  }, [selectedTenantId, period]);

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
          <button type="button" onClick={() => setSelectedTenantId(null)}>Back</button>
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
        onBack={() => setSelectedTenantId(null)}
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
            ? <GrowthExtremesChart tenants={tenantKpis} onTenantSelect={setSelectedTenantId} />
            : <EmptyState title="No tenant data" />}
        </div>
      </section>

      <section className="charts-row charts-row--analysis" aria-label="Portfolio analysis charts">
        <div className="chart-slot">
          {tenantKpis.length > 0
            ? <RevenueDistributionChart tenants={tenantKpis} onTenantSelect={setSelectedTenantId} />
            : <EmptyState title="No tenant revenue data" />}
        </div>
        <div className="chart-slot">
          {tenantKpis.length > 0
            ? <MomentumMatrixChart tenants={tenantKpis} onTenantSelect={setSelectedTenantId} />
            : <EmptyState title="No tenant momentum data" />}
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
