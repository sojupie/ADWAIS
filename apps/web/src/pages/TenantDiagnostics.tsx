import { formatCurrency, formatNumber } from '@utils';
import { ArrowLeft } from 'lucide-react';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { CumulativeGrowthDeltaChart } from '../components/TenantSpecific/CumulativeGrowthDeltaChart';
import { OrderValueDistributionChart } from '../components/TenantSpecific/OrderValueDistributionChart';
import { AccumulatedRevenueChart } from '../components/financial/AccumulatedRevenueChart';
import { TransactionDensityChart } from '../components/financial/TransactionDensityChart';
import {
  useGlobalKpis, 
  useAccumulatedRevenue,
  useCumulativeGrowthDelta, 
  useOrderDistribution,
  useTransactionDensity
} from '../hooks/useFinancialQueries';
import {DashboardLayout} from "../components/common/layout/DashboardLayout.tsx";
import {DashboardTopRow} from "../components/common/layout/DashboardTopRow.tsx";
import {DashboardFlexRow} from "../components/common/layout/DashboardFlexRow.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';

const EMPTY_ACCUMULATED: never[] = [];
const EMPTY_DENSITY: never[] = [];
const EMPTY_DELTA: never[] = [];
const EMPTY_BINS: never[] = [];

interface Props {
  tenantId: string;
  tenantName: string;
  tenantType: string;
  timeframe: string;
  onBack: () => void;
}

export function TenantDiagnostics({ tenantId, tenantName, tenantType, timeframe, onBack }: Props) {
  const kpiQuery = useGlobalKpis(timeframe, tenantId);
  const globalKpiQuery = useGlobalKpis(timeframe);
  const accumulatedQuery = useAccumulatedRevenue(timeframe, tenantId);
  const densityQuery = useTransactionDensity(timeframe, tenantId);
  const deltaQuery = useCumulativeGrowthDelta(timeframe, tenantId);
  const orderQuery = useOrderDistribution(timeframe, tenantId);

  const kpis = kpiQuery.data;
  const globalKpis = globalKpiQuery.data;
  
  const shareOfRevenue = kpis && globalKpis && globalKpis.currentRevenue > 0 
    ? (kpis.currentRevenue / globalKpis.currentRevenue) * 100 
    : undefined;

  return (
    <DashboardLayout>
      <header className="flex items-center gap-6 shrink-0">
        <button
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-xl font-extrabold text-slate-700 hover:text-brand-text hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          type="button"
          onClick={onBack}
          aria-label="Back to financial overview"
        >
          <ArrowLeft size={20} className="stroke-[3px]" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">{tenantName} Diagnostics</h1>
            <span 
              className={`inline-flex items-center px-3 py-1 rounded-sm text-xs font-black uppercase tracking-widest shadow-sm ${
                tenantType === 'B2C' ? 'bg-chart-1 text-white' : 
                tenantType === 'Mixed' ? 'bg-chart-2 text-white' : 
                'bg-(--color-brand-btn-primary) text-white'
              }`}
            >
              {tenantType}
            </span>
          </div>
          <p className="text-sm text-slate-500 m-0 font-medium tracking-wide">Isolated entity performance view for the {timeframe} period.</p>
        </div>
      </header>

      <DashboardTopRow>
        <FactPanel
          label={`Revenue (${timeframe})`}
          value={kpis ? formatCurrency(kpis.currentRevenue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpis?.revenueGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpis.revenueGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Share of Revenue"
          value={shareOfRevenue !== undefined ? `${shareOfRevenue.toFixed(1)}%` : '\u2014'}
          isLoading={kpiQuery.isLoading || globalKpiQuery.isLoading}
          extra={{ type: 'Desc', value: 'of Global Portfolio' }}
        />
        <FactPanel
          label="Transaction Volume"
          value={kpis ? formatNumber(kpis.transactionVolume) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpis?.volumeGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpis.volumeGrowthPercentage }
            : undefined}
        />
        <FactPanel
          label="Average Order Value"
          value={kpis ? formatCurrency(kpis.averageOrderValue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpis?.aovGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpis.aovGrowthPercentage }
            : undefined}
        />
      </DashboardTopRow>

      <DashboardFlexRow weight={"flex-1"} gridCols={"2"}>
        <AccumulatedRevenueChart 
          points={accumulatedQuery.data || EMPTY_ACCUMULATED} 
          isLoading={accumulatedQuery.isLoading} 
          className="h-full min-h-87.5"
        />
        
        <TransactionDensityChart
          points={densityQuery.data || EMPTY_DENSITY}
          isLoading={densityQuery.isLoading}
          className="h-full min-h-87.5"
        />

        <CumulativeGrowthDeltaChart 
          points={deltaQuery.data || EMPTY_DELTA} 
          isLoading={deltaQuery.isLoading} 
          className="h-full min-h-87.5"
        />

        <OrderValueDistributionChart 
          bins={orderQuery.data || EMPTY_BINS} 
          isLoading={orderQuery.isLoading} 
          className="h-full min-h-87.5"
        />
      </DashboardFlexRow>

      {/* ── Inline Widgets (Mobile/Tablet) ── */}
      <div className="xl:hidden flex flex-col md:flex-row justify-center gap-6 items-center w-full pb-6 shrink-0">
        <SyncStatusWidget />
        <PeriodSelector from="/financial" />
      </div>

      {/* ── Floating Widgets (Desktop Wide) ── */}
      <div className="hidden xl:block fixed bottom-6 left-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SyncStatusWidget />
      </div>
      <div className="hidden xl:block fixed bottom-6 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PeriodSelector from="/financial" />
      </div>
    </DashboardLayout>
  );
}
