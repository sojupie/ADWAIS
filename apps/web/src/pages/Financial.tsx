import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { ArrowLeft } from 'lucide-react';
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
import { TenantSelector } from '../components/financial/TenantSelector';
import { useFinancialViewModel } from "../hooks/useFinancialViewModel.ts";
import type { RevenueEfficiencyResponse, MomentumResponse, TransactionDensityResponse } from '@types';

const EMPTY_VELOCITY: never[] = [];
const EMPTY_DENSITY: TransactionDensityResponse = { points: [], totalCount: 0, minCount: 0, maxCount: 0, periodStart: '', periodEnd: '' };
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
      />
    );
  }

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between gap-2 shrink-0 w-full flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-6 mb-1">
            <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Global Portfolio</h1>
          </div>
          <p className="text-sm text-on-surface-variant m-0 font-medium tracking-wide">Performance overview across all active tenants. VAT included.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-full border border-outline-variant bg-slate-300 flex items-center justify-center text-slate-400 cursor-not-allowed shrink-0"
            aria-label="Already at global portfolio"
          >
            <ArrowLeft size={20} className="stroke-[2.5]" />
          </button>
          <TenantSelector />
        </div>
      </header>

      {/* KPI Section */}
      <DashboardTopRow>
        <FactPanel
          label={`Global Revenue (${vm.timeframe})`}
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
          isLoading={vm.densityQuery.isLoading} 
          isStale={vm.densityQuery.isPlaceholderData}
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <RevenueEfficiencyChart 
          response={vm.efficiencyQuery.data || EMPTY_EFFICIENCY}
          comparison="YearOverYear"
          onTenantSelect={vm.handleTenantSelect} 
          isLoading={vm.efficiencyQuery.isLoading} 
          isStale={vm.efficiencyQuery.isPlaceholderData}
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <MomentumMatrixChart 
          momentum={vm.momentumQuery.data || EMPTY_MOMENTUM}
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
        <PeriodSelector from="/financial" />
      </DashboardFooter>
    </DashboardLayout>
  );
}
