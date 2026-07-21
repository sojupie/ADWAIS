import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueEfficiencyChart } from '../components/financial/RevenueEfficiencyChart';
import { TransactionDensityChart } from '../components/financial/TransactionDensityChart';
import { AccumulatedRevenueChart } from '../components/financial/AccumulatedRevenueChart';
import { TenantDiagnostics } from './TenantDiagnostics';
import { DashboardLayout } from "../components/common/layout/DashboardLayout.tsx";
import { DashboardTopRow } from "../components/common/layout/DashboardTopRow.tsx";
import { DashboardFlexRow } from "../components/common/layout/DashboardFlexRow.tsx";
import { DashboardFooter } from "../components/common/layout/DashboardFooter.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { useFinancialViewModel } from "../hooks/useFinancialViewModel.ts";
import type { RevenueEfficiencyResponse, MomentumResponse, TransactionDensityResponseDto } from '@types';
import { FinancialFilterMenu, FinancialFilterPanel } from '../components/financial/FinancialFilterMenu.tsx';
import { MobileFooterActions } from '../components/common/ui/MobileFooterActions.tsx';
import { countActiveFilterGroups } from '../utils/filterCounts.ts';

const EMPTY_VELOCITY: never[] = [];
const EMPTY_DENSITY: TransactionDensityResponseDto = {
  points: [],
  totalCount: 0,
  minCount: 0,
  maxCount: 0,
  averageCountPerBucket: 0,
  sampleQuality: 'Sparse',
  requestedPeriod: 'Auto',
  effectivePeriod: 'T30',
  timeZoneId: 'Europe/Stockholm',
  periodStart: '',
  periodEnd: '',
};
const EMPTY_EFFICIENCY: RevenueEfficiencyResponse = { tenants: [], globalAverageOrderValue: 0, medianOrderVolume: 0, medianPortfolioShare: 0 };
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
        tenantOptions={vm.tenantOptions}
        selectedTenantTypes={vm.selectedTenantTypes}
        tenantsLoading={vm.tenantsQuery.isLoading}
        onTenantChange={vm.handleTenantChange}
        onTypesChange={vm.setSelectedTenantTypes}
        onClearFilters={vm.clearFinancialFilters}
      />
    );
  }

  const revenueLabel = vm.selectedTenantTypes.length > 0
    ? `${vm.selectedTenantTypes.join(', ')} Revenue (${vm.timeframe})`
    : `Global Revenue (${vm.timeframe})`;

  return (
    <DashboardLayout>
      {/* KPI Section */}
      <DashboardTopRow>
        <FactPanel
          label={revenueLabel}
          value={vm.kpiQuery.data ? formatCurrency(vm.kpiQuery.data.currentRevenue) : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.revenueGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.revenueGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
        <FactPanel
          label="Transaction Volume"
          value={vm.kpiQuery.data ? formatNumber(vm.kpiQuery.data.transactionVolume) : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.volumeGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.volumeGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
        <FactPanel
          label="Portfolio AOV"
          value={vm.kpiQuery.data ? `${formatCompact(vm.kpiQuery.data.averageOrderValue)} SEK` : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.aovGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.aovGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
        <FactPanel
          label="Active Tenants"
          value={vm.kpiQuery.data?.activeTenants !== undefined ? vm.kpiQuery.data.activeTenants.toString() : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.activeTenantsGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.activeTenantsGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
        <FactPanel
          label="Avg Revenue Per Tenant"
          value={vm.kpiQuery.data?.averageRevenuePerTenant !== undefined ? formatCompact(vm.kpiQuery.data.averageRevenuePerTenant) : '\u2014'}
          isLoading={vm.kpiQuery.isLoading}
          extra={vm.kpiQuery.data?.arptGrowthPercentage !== undefined
            ? { type: 'PoP', value: vm.kpiQuery.data.arptGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
      </DashboardTopRow>

      {/* Charts Grid: Strictly Responsive & Independent */}
      <DashboardFlexRow weight={"flex-1"} gridCols={"2"}>
        <AccumulatedRevenueChart 
          points={vm.velocityQuery.data || EMPTY_VELOCITY}
          isLoading={vm.velocityQuery.isLoading} 
          isStale={vm.velocityQuery.isPlaceholderData}
          comparison="YearOverYear"
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <TransactionDensityChart 
          response={vm.densityQuery.data || EMPTY_DENSITY}
          selectedPeriod={vm.densityPeriod}
          onPeriodChange={vm.setDensityPeriod}
          isLoading={vm.densityQuery.isLoading} 
          isStale={vm.densityQuery.isPlaceholderData}
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <RevenueEfficiencyChart 
          response={vm.efficiencyData || EMPTY_EFFICIENCY}
          comparison="YearOverYear"
          onTenantSelect={vm.handleTenantSelect} 
          isLoading={vm.efficiencyQuery.isLoading} 
          isStale={vm.efficiencyQuery.isPlaceholderData}
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <MomentumMatrixChart 
          momentum={vm.momentumData || EMPTY_MOMENTUM}
          comparison="YearOverYear"
          onTenantSelect={vm.handleTenantSelect} 
          isLoading={vm.momentumQuery.isLoading} 
          isStale={vm.momentumQuery.isPlaceholderData}
          className="h-full min-h-[350px] contained:min-h-0"
        />
      </DashboardFlexRow>

      {/* ── Footer Widgets (All Resolutions) ── */}
      <DashboardFooter>
        <SyncStatusWidget />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <FinancialFilterMenu
            tenants={vm.tenantOptions}
            selectedTenantId={vm.tenantId ?? null}
            selectedTypes={vm.selectedTenantTypes}
            isLoading={vm.tenantsQuery.isLoading}
            onTenantChange={vm.handleTenantChange}
            onTypesChange={vm.setSelectedTenantTypes}
            onClearAll={vm.clearFinancialFilters}
          />
          <div className="mx-1 h-6 w-px shrink-0 bg-outline-variant" aria-hidden="true" />
          <PeriodSelector from="/financial" />
        </div>
      </DashboardFooter>
      <MobileFooterActions
        activeCount={countActiveFilterGroups(Boolean(vm.tenantId), vm.selectedTenantTypes.length > 0)}
        clearLabel="Clear all financial filters"
        onClearAll={vm.clearFinancialFilters}
      >
        <FinancialFilterPanel
          embedded
          tenants={vm.tenantOptions}
          selectedTenantId={vm.tenantId ?? null}
          selectedTypes={vm.selectedTenantTypes}
          isLoading={vm.tenantsQuery.isLoading}
          onTenantChange={vm.handleTenantChange}
          onTypesChange={vm.setSelectedTenantTypes}
          onClearAll={vm.clearFinancialFilters}
        />
      </MobileFooterActions>
    </DashboardLayout>
  );
}
