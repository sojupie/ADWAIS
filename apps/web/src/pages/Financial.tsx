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
import {getSavedTimeframe} from "../utils/timeframeStorage.ts";
import {DashboardLayout} from "../components/common/layout/DashboardLayout.tsx";
import {DashboardTopRow} from "../components/common/layout/DashboardTopRow.tsx";
import {DashboardFlexRow} from "../components/common/layout/DashboardFlexRow.tsx";

export function Financial() {
  const { tenantId } = useSearch({ from: '/financial' });
  const timeframe = getSavedTimeframe('/financial');
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
    <DashboardLayout>
      {/* KPI Section */}
      <DashboardTopRow>
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
      </DashboardTopRow>

      {/* Charts Grid: Strictly Responsive & Independent */}
      <DashboardFlexRow weight={"flex-1"} gridCols={"2"}>
        <AccumulatedRevenueChart 
          points={velocityQuery.data || []} 
          isLoading={velocityQuery.isLoading} 
          className="h-full min-h-87.5"
        />

        <VolumeAnomalyChart 
          entries={anomalyQuery.data || []} 
          onTenantSelect={handleTenantSelect} 
          isLoading={anomalyQuery.isLoading} 
          className="h-full min-h-87.5"
        />

        <RevenueEfficiencyChart 
          response={efficiencyQuery.data || { tenants: [], globalAverageOrderValue: 0, medianPortfolioShare: 0 }} 
          onTenantSelect={handleTenantSelect} 
          isLoading={efficiencyQuery.isLoading} 
          className="h-full min-h-87.5"
        />

        <MomentumMatrixChart 
          momentum={momentumQuery.data || { tenants: [], medianBaselineRevenue: 0, globalGrowthPercentage: 0 }} 
          onTenantSelect={handleTenantSelect} 
          isLoading={momentumQuery.isLoading} 
          className="h-full min-h-87.5"
        />
      </DashboardFlexRow>
    </DashboardLayout>
  );
}
