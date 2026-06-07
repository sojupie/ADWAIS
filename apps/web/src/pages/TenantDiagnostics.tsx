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
    <div className="flex flex-col gap-6 w-full min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              className={`inline-flex items-center px-3 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest shadow-sm ${
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

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-shrink-0">
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
      </section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        <AccumulatedRevenueChart 
          points={accumulatedQuery.data || []} 
          isLoading={accumulatedQuery.isLoading} 
          className="h-full min-h-87.5"
        />
        
        <TransactionDensityChart
          points={densityQuery.data || []}
          isLoading={densityQuery.isLoading}
          className="h-full min-h-87.5"
        />

        <CumulativeGrowthDeltaChart 
          points={deltaQuery.data || []} 
          isLoading={deltaQuery.isLoading} 
          className="h-full min-h-87.5"
        />

        <OrderValueDistributionChart 
          bins={orderQuery.data || []} 
          isLoading={orderQuery.isLoading} 
          className="h-full min-h-87.5"
        />
      </div>
    </div>
  );
}
