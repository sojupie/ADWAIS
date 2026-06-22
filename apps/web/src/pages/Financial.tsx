import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueEfficiencyChart } from '../components/financial/RevenueEfficiencyChart';
import { VolumeAnomalyChart } from '../components/financial/VolumeAnomalyChart';
import { AccumulatedRevenueChart } from '../components/financial/AccumulatedRevenueChart';
import { TenantDiagnostics } from './TenantDiagnostics';
import { DashboardLayout } from "../components/common/layout/DashboardLayout.tsx";
import { DashboardTopRow } from "../components/common/layout/DashboardTopRow.tsx";
import { DashboardFlexRow } from "../components/common/layout/DashboardFlexRow.tsx";
import { DashboardFooter } from "../components/common/layout/DashboardFooter.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { useFinancialViewModel } from "../hooks/useFinancialViewModel.ts";
import type { RevenueEfficiencyResponse, MomentumResponse } from '@types';

const EMPTY_VELOCITY: never[] = [];
const EMPTY_ANOMALY: never[] = [];
const EMPTY_EFFICIENCY: RevenueEfficiencyResponse = { tenants: [], globalAverageOrderValue: 0, medianPortfolioShare: 0 };
const EMPTY_MOMENTUM: MomentumResponse = { tenants: [], medianBaselineRevenue: 0, globalGrowthPercentage: 0 };

export function Financial() {
  const vm = useFinancialViewModel();

  if (vm.tenantId && vm.selectedTenantDetails) {
    return (
      <TenantDiagnostics
        tenantId={vm.tenantId}
        tenantName={vm.selectedTenantDetails.tenantName}
        tenantType={vm.selectedTenantDetails.type}
        timeframe={vm.timeframe}
        onBack={vm.handleBackToGlobal}
      />
    );
  }

  return (
    <DashboardLayout scrollable={true}>
      {/* KPI Section */}
      <DashboardTopRow>
        <FactPanel
          label={`Global Revenue (${vm.timeframe})`}
          value={vm.kpiQuery.data ? formatCurrency(vm.kpiQuery.data.currentRevenue) : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.revenueGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.revenueGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Transaction Volume"
          value={vm.kpiQuery.data ? formatNumber(vm.kpiQuery.data.transactionVolume) : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.volumeGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.volumeGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Portfolio AOV"
          value={vm.kpiQuery.data ? `${formatCompact(vm.kpiQuery.data.averageOrderValue)} SEK` : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.aovGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.aovGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Active Tenants"
          value={vm.kpiQuery.data?.activeTenants !== undefined ? vm.kpiQuery.data.activeTenants.toString() : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.activeTenantsGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.activeTenantsGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Avg Revenue Per Tenant"
          value={vm.kpiQuery.data?.averageRevenuePerTenant !== undefined ? formatCompact(vm.kpiQuery.data.averageRevenuePerTenant) : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.arptGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.arptGrowthPercentage }
            : undefined}
        />
      </DashboardTopRow>

      {/* Charts Grid: Strictly Responsive & Independent */}
      <DashboardFlexRow weight={"flex-1"} gridCols={"2"}>
        <AccumulatedRevenueChart 
          points={vm.velocityQuery.data || EMPTY_VELOCITY}
          isLoading={vm.velocityQuery.isLoading} 
          isStale={vm.velocityQuery.isPlaceholderData}
          comparison="YearOverYear"
          className="h-full min-h-87.5"
        />

        <VolumeAnomalyChart 
          entries={vm.anomalyQuery.data || EMPTY_ANOMALY}
          comparison="YearOverYear"
          onTenantSelect={vm.handleTenantSelect} 
          isLoading={vm.anomalyQuery.isLoading} 
          isStale={vm.anomalyQuery.isPlaceholderData}
          className="h-full min-h-87.5"
        />

        <RevenueEfficiencyChart 
          response={vm.efficiencyQuery.data || EMPTY_EFFICIENCY}
          comparison="YearOverYear"
          onTenantSelect={vm.handleTenantSelect} 
          isLoading={vm.efficiencyQuery.isLoading} 
          isStale={vm.efficiencyQuery.isPlaceholderData}
          className="h-full min-h-87.5"
        />

        <MomentumMatrixChart 
          momentum={vm.momentumQuery.data || EMPTY_MOMENTUM}
          comparison="YearOverYear"
          onTenantSelect={vm.handleTenantSelect} 
          isLoading={vm.momentumQuery.isLoading} 
          isStale={vm.momentumQuery.isPlaceholderData}
          className="h-full min-h-87.5"
        />
      </DashboardFlexRow>

      {/* ── Footer Widgets (All Resolutions) ── */}
      <DashboardFooter>
        <SyncStatusWidget />
        <PeriodSelector from="/financial" />
      </DashboardFooter>
    </DashboardLayout>
  );
}
