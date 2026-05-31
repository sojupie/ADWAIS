import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueEfficiencyChart } from '../components/financial/RevenueEfficiencyChart';
import { VolumeAnomalyChart } from '../components/financial/VolumeAnomalyChart';
import { AccumulatedRevenueChart } from '../components/financial/AccumulatedRevenueChart';
import { TenantDiagnostics } from './TenantDiagnostics';
import { 
  useGlobalKpis, 
  useAccumulatedRevenue, 
  useGrowthExtremes, 
  useMomentum, 
  useRevenueEfficiency,
  useVolumeAnomaly
} from '../hooks/useFinancialQueries';

export function Financial() {
  const { timeframe, tenantId } = useSearch({ from: '/financial' });
  const navigate = useNavigate({ from: '/financial' });

  const kpiQuery = useGlobalKpis(timeframe);
  const velocityQuery = useAccumulatedRevenue(timeframe);
  const extremesQuery = useGrowthExtremes(timeframe);
  const momentumQuery = useMomentum(timeframe);
  const efficiencyQuery = useRevenueEfficiency(timeframe);
  const anomalyQuery = useVolumeAnomaly(timeframe);

  const selectedTenantDetails = useMemo(() => {
    const efficiencyTenants = efficiencyQuery.data?.tenants;
    const momentumTenants = momentumQuery.data?.tenants;

    const tenantName = extremesQuery.data?.find(e => e.tenantId === tenantId)?.tenantName 
      || efficiencyTenants?.find((d) => d.tenantId === tenantId)?.tenantName 
      || anomalyQuery.data?.find(a => a.tenantId === tenantId)?.tenantName
      || momentumTenants?.find((t) => t.tenantId === tenantId)?.tenantName
      || 'Unknown Tenant';

    const type = efficiencyTenants?.find((d) => d.tenantId === tenantId)?.type
      || momentumTenants?.find((t) => t.tenantId === tenantId)?.type
      || 'Mixed';
      
    return { tenantName, type };
  }, [tenantId, extremesQuery.data, efficiencyQuery.data, anomalyQuery.data, momentumQuery.data]);

  if (tenantId && selectedTenantDetails) {
    return (
      <TenantDiagnostics
        tenantId={tenantId}
        tenantName={selectedTenantDetails.tenantName}
        tenantType={selectedTenantDetails.type}
        timeframe={timeframe}
        onBack={() => navigate({ search: (prev) => ({ ...prev, tenantId: undefined }) })}
      />
    );
  }

  const handleTenantSelect = (id: string) => {
    navigate({ search: (prev) => ({ ...prev, tenantId: id }) });
  };



  return (
    <div className="flex flex-col gap-6 w-full min-h-full animate-in fade-in duration-700">
      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 flex-shrink-0">
        <FactPanel
          label={`Global Revenue (${timeframe})`}
          value={kpiQuery.data ? formatCurrency(kpiQuery.data.currentRevenue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpiQuery.data?.revenueGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpiQuery.data.revenueGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Transaction Volume"
          value={kpiQuery.data ? formatNumber(kpiQuery.data.transactionVolume) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpiQuery.data?.volumeGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpiQuery.data.volumeGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Portfolio AOV"
          value={kpiQuery.data ? `${formatCompact(kpiQuery.data.averageOrderValue)} SEK` : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpiQuery.data?.aovGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpiQuery.data.aovGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Active Tenants"
          value={kpiQuery.data?.activeTenants !== undefined ? kpiQuery.data.activeTenants.toString() : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpiQuery.data?.activeTenantsGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpiQuery.data.activeTenantsGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Avg Revenue Per Tenant"
          value={kpiQuery.data?.averageRevenuePerTenant !== undefined ? formatCompact(kpiQuery.data.averageRevenuePerTenant) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpiQuery.data?.arptGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpiQuery.data.arptGrowthPercentage }
            : undefined}
        />
      </section>

      {/* Charts Grid: Strictly Responsive & Independent */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        <AccumulatedRevenueChart 
          points={velocityQuery.data || []} 
          isLoading={velocityQuery.isLoading} 
          className="h-full min-h-[350px]" 
        />

        <VolumeAnomalyChart 
          entries={anomalyQuery.data || []} 
          onTenantSelect={handleTenantSelect} 
          isLoading={anomalyQuery.isLoading} 
          className="h-full min-h-[350px]" 
        />

        <RevenueEfficiencyChart 
          response={efficiencyQuery.data || { tenants: [], globalAverageOrderValue: 0, medianPortfolioShare: 0 }} 
          onTenantSelect={handleTenantSelect} 
          isLoading={efficiencyQuery.isLoading} 
          className="h-full min-h-[350px]" 
        />

        <MomentumMatrixChart 
          momentum={momentumQuery.data || { tenants: [], medianBaselineRevenue: 0, globalGrowthPercentage: 0 }} 
          onTenantSelect={handleTenantSelect} 
          isLoading={momentumQuery.isLoading} 
          className="h-full min-h-[350px]" 
        />
      </div>
    </div>
  );
}
