import { useEffect, useState } from 'react';
import { formatCurrency, formatCompact, formatNumber } from '@utils';
import type {
  FinancialKpi,
  FinancialVelocityPoint,
  TenantDiagnostics as TenantDiagnosticsData,
} from '@types';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { GrowthExtremesChart } from '../components/financial/GrowthExtremesChart';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueDistributionChart } from '../components/financial/RevenueDistributionChart';
import { RevenueVelocityChart } from '../components/financial/RevenueVelocityChart';
import { setDashboardPeriod, useDashboardData, type Period } from '../dashboardDataStore';
import { TenantDiagnostics } from './TenantDiagnostics';
import './Financial.css';

type TenantResponse = {
  id: string;
  name: string;
};

type OrderDistributionBin = {
  binLabel: string;
  binMin: number;
  binMax: number;
  orderCount: number;
};

export function Financial() {
  const { period, loading, globalKpi, growthExtremes, globalVelocity, momentum, distribution } = useDashboardData();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantDiagnostics, setTenantDiagnostics] = useState<TenantDiagnosticsData | null>(null);
  const [tenantDiagnosticsLoading, setTenantDiagnosticsLoading] = useState(false);
  const [tenantDiagnosticsError, setTenantDiagnosticsError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTenantId) {
      setTenantDiagnostics(null);
      setTenantDiagnosticsError(null);
      setTenantDiagnosticsLoading(false);
      return;
    }

    const tenantId = selectedTenantId;
    const controller = new AbortController();

    async function fetchTenantDiagnostics() {
      setTenantDiagnosticsLoading(true);
      setTenantDiagnosticsError(null);

      try {
        const timeframe = `T${period}`;
        const tenantQuery = `timeframe=${timeframe}&tenantId=${encodeURIComponent(tenantId)}`;
        const [tenant, kpi, tenantVelocity, portfolioVelocity, orderDistribution] = await Promise.all([
          fetchJson<TenantResponse>(`/api/tenants/${tenantId}`, controller.signal),
          fetchJson<FinancialKpi>(`/api/financial/kpis?${tenantQuery}`, controller.signal),
          fetchJson<FinancialVelocityPoint[]>(`/api/financial/velocity?${tenantQuery}`, controller.signal),
          fetchJson<FinancialVelocityPoint[]>(`/api/financial/velocity?timeframe=${timeframe}`, controller.signal),
          fetchJson<OrderDistributionBin[]>(`/api/financial/order-distribution?${tenantQuery}`, controller.signal),
        ]);

        const daily = tenantVelocity.map((point, index) => {
          const portfolioPoint = portfolioVelocity[index];
          const globalRevenue = portfolioPoint?.currentRevenue ?? 0;

          return {
            createdDate: point.periodLabel,
            dayIndex: index + 1,
            revenue: point.currentRevenue,
            volume: 0,
            previousRevenue: point.previousRevenue,
            globalRevenue,
            portfolioShare: globalRevenue > 0 ? (point.currentRevenue / globalRevenue) * 100 : 0,
          };
        });

        setTenantDiagnostics({
          tenantId: tenant.id,
          tenantName: tenant.name,
          days: period,
          totalRevenue: kpi.currentRevenue,
          totalVolume: kpi.transactionVolume,
          aov: kpi.averageOrderValue,
          previousRevenue: kpi.previousRevenue,
          previousVolume: 0,
          previousAov: 0,
          revenuePoP: kpi.revenueGrowthPercentage,
          volumePoP: 0,
          aovPoP: 0,
          daily,
          orderValueDistribution: orderDistribution.map((bin) => ({
            range: bin.binLabel,
            minValue: bin.binMin,
            maxValue: bin.binMax,
            orderCount: bin.orderCount,
          })),
        });
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
          {globalVelocity.length > 0
            ? <RevenueVelocityChart points={globalVelocity} />
            : <EmptyState title="No revenue data" />}
        </div>
        <div className="chart-slot">
          {growthExtremes.length > 0
            ? <GrowthExtremesChart tenants={growthExtremes} onTenantSelect={setSelectedTenantId} />
            : <EmptyState title="No tenant data" />}
        </div>
      </section>

      <section className="charts-row charts-row--analysis" aria-label="Portfolio analysis charts">
        <div className="chart-slot">
          {distribution.length > 0
            ? <RevenueDistributionChart entries={distribution} onTenantSelect={setSelectedTenantId} />
            : <EmptyState title="No tenant revenue data" />}
        </div>
        <div className="chart-slot">
          {momentum && momentum.tenants.length > 0
            ? <MomentumMatrixChart momentum={momentum} onTenantSelect={setSelectedTenantId} />
            : <EmptyState title="No tenant momentum data" />}
        </div>
      </section>
    </>
  );
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
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
