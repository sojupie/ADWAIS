import { formatCurrency, formatNumber } from '@utils';
import { ArrowLeft } from 'lucide-react';
import { Route } from '../routes/financial';
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
import { DashboardFooter } from "../components/common/layout/DashboardFooter.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { TenantSelector } from '../components/financial/TenantSelector';

const EMPTY_ACCUMULATED: never[] = [];
const EMPTY_DENSITY: never[] = [];
const EMPTY_DELTA: never[] = [];
const EMPTY_BINS: never[] = [];

interface Props {
  tenantId: string;
  tenantName: string;
  tenantType: string;
  timeframe: string;
}

export function TenantDiagnostics({ tenantId, tenantName, tenantType, timeframe }: Props) {
  const kpiQuery = useGlobalKpis(timeframe, tenantId);
  const globalKpiQuery = useGlobalKpis(timeframe);
  const accumulatedQuery = useAccumulatedRevenue(timeframe, tenantId, 'YearOverYear');
  const densityQuery = useTransactionDensity(timeframe, tenantId);
  const deltaQuery = useCumulativeGrowthDelta(timeframe, tenantId, 'YearOverYear');
  const orderQuery = useOrderDistribution(timeframe, tenantId);

  const navigate = Route.useNavigate();
  const handleBackToGlobal = () => {
    void navigate({
      search: (prev) => ({
        ...prev,
        tenantId: undefined,
      }),
    });
  };

  const kpis = kpiQuery.data;
  const globalKpis = globalKpiQuery.data;
  
  const shareOfRevenue = kpis && globalKpis && globalKpis.currentRevenue > 0 
    ? (kpis.currentRevenue / globalKpis.currentRevenue) * 100 
    : undefined;

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between gap-1 shrink-0 flex-wrap w-full">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">{tenantName} Diagnostics</h1>
            <span 
              className={`inline-flex items-center px-3 py-1 rounded-sm text-sm font-black uppercase tracking-widest shadow-sm shrink-0 ${
                tenantType === 'B2C' ? 'bg-chart-1 text-white' : 
                tenantType === 'Mixed' ? 'bg-chart-2 text-white' : 
                'bg-(--color-brand-btn-primary) text-white'
              }`}
            >
              {tenantType}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant m-0 font-medium tracking-wide">Isolated entity performance view for the {timeframe} period. VAT included.</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleBackToGlobal}
            className="w-10 h-10 rounded-full border border-outline-variant bg-surface flex items-center justify-center text-on-surface-variant hover:text-brand-text hover:bg-surface-container-low hover:border-outline-variant active:bg-surface-container transition-all shadow-sm cursor-pointer shrink-0"
            aria-label="Back to global portfolio"
          >
            <ArrowLeft size={20} className="stroke-[2.5]" />
          </button>
          <TenantSelector />
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
          hasExtra={true}
        />
        <FactPanel
          label="Share of Revenue"
          value={shareOfRevenue !== undefined ? `${shareOfRevenue.toFixed(1)}%` : '\u2014'}
          isLoading={kpiQuery.isLoading || globalKpiQuery.isLoading}
          extra={{ type: 'Desc', value: 'of Global Portfolio' }}
          hasExtra={true}
        />
        <FactPanel
          label="Transaction Volume"
          value={kpis ? formatNumber(kpis.transactionVolume) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpis?.volumeGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpis.volumeGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
        <FactPanel
          label="Average Order Value"
          value={kpis ? formatCurrency(kpis.averageOrderValue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
          extra={kpis?.aovGrowthPercentage !== undefined
            ? { type: 'PoP', value: kpis.aovGrowthPercentage }
            : undefined}
          hasExtra={true}
        />
      </DashboardTopRow>

      <DashboardFlexRow weight={"flex-1"} gridCols={"2"}>
        <AccumulatedRevenueChart 
          points={accumulatedQuery.data || EMPTY_ACCUMULATED} 
          isLoading={accumulatedQuery.isLoading} 
          isStale={accumulatedQuery.isPlaceholderData}
          comparison="YearOverYear"
          className="h-full min-h-[350px] contained:min-h-0"
        />
        
        <TransactionDensityChart
          points={densityQuery.data || EMPTY_DENSITY}
          isLoading={densityQuery.isLoading}
          isStale={densityQuery.isPlaceholderData}
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <CumulativeGrowthDeltaChart 
          points={deltaQuery.data || EMPTY_DELTA} 
          isLoading={deltaQuery.isLoading} 
          isStale={deltaQuery.isPlaceholderData}
          comparison="YearOverYear"
          className="h-full min-h-[350px] contained:min-h-0"
        />

        <OrderValueDistributionChart 
          bins={orderQuery.data || EMPTY_BINS} 
          isLoading={orderQuery.isLoading} 
          isStale={orderQuery.isPlaceholderData}
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
