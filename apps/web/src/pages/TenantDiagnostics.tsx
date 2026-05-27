import { formatCurrency, formatNumber } from '@utils';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { CumulativeGrowthDeltaChart } from '../components/TenantSpecific/CumulativeGrowthDeltaChart';
import { OrderValueDistributionChart } from '../components/TenantSpecific/OrderValueDistributionChart';
import { PortfolioRevenueShareTrajectoryChart } from '../components/TenantSpecific/PortfolioRevenueShareTrajectoryChart';
import { TenantRevenueVelocityChart } from '../components/TenantSpecific/TenantRevenueVelocityChart';
import { 
  useGlobalKpis, 
  useFinancialVelocity, 
  useCumulativeGrowthDelta, 
  useOrderDistribution 
} from '../hooks/useFinancialQueries';

interface Props {
  tenantId: string;
  tenantName: string;
  timeframe: string;
  onBack: () => void;
}

export function TenantDiagnostics({ tenantId, tenantName, timeframe, onBack }: Props) {
  const kpiQuery = useGlobalKpis(timeframe, tenantId);
  const velocityQuery = useFinancialVelocity(timeframe, tenantId);
  const portfolioVelocityQuery = useFinancialVelocity(timeframe);
  const deltaQuery = useCumulativeGrowthDelta(timeframe, tenantId);
  const orderQuery = useOrderDistribution(timeframe, tenantId);

  const kpis = kpiQuery.data;
  const growthColor = kpis && kpis.revenueGrowthPercentage > 0 ? 'green' : kpis && kpis.revenueGrowthPercentage < 0 ? 'red' : undefined;

  return (
    <div className="flex flex-col gap-6 w-full min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-6 flex-shrink-0">
        <button
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-xl font-extrabold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          type="button"
          onClick={onBack}
          aria-label="Back to financial overview"
        >
          &larr;
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">{tenantName} Diagnostics</h1>
          <p className="text-sm text-slate-500 m-0 font-medium tracking-wide">Isolated entity performance view for the {timeframe} period.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-shrink-0">
        <FactPanel
          label={`Revenue (${timeframe})`}
          value={kpis ? formatCurrency(kpis.currentRevenue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
        />
        <FactPanel
          label={`Growth (vs Prev)`}
          value={kpis ? `${kpis.revenueGrowthPercentage >= 0 ? '+' : ''}${kpis.revenueGrowthPercentage.toFixed(2)}%` : '\u2014'}
          valueColor={growthColor as any}
          isLoading={kpiQuery.isLoading}
        />
        <FactPanel
          label="Transaction Volume"
          value={kpis ? formatNumber(kpis.transactionVolume) : '\u2014'}
          isLoading={kpiQuery.isLoading}
        />
        <FactPanel
          label="Average Order Value"
          value={kpis ? formatCurrency(kpis.averageOrderValue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
        />
      </section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        {velocityQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center h-full">
            <LoadingIcon />
          </div>
        ) : velocityQuery.data ? (
          <TenantRevenueVelocityChart points={velocityQuery.data} className="h-full min-h-[350px]" />
        ) : null}
        
        {velocityQuery.isLoading || portfolioVelocityQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center h-full">
            <LoadingIcon />
          </div>
        ) : velocityQuery.data && portfolioVelocityQuery.data ? (
          <PortfolioRevenueShareTrajectoryChart
            tenantVelocity={velocityQuery.data}
            portfolioVelocity={portfolioVelocityQuery.data}
            className="h-full min-h-[350px]"
          />
        ) : null}

        {deltaQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center h-full">
            <LoadingIcon />
          </div>
        ) : deltaQuery.data ? (
          <CumulativeGrowthDeltaChart points={deltaQuery.data} className="h-full min-h-[350px]" />
        ) : null}

        {orderQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center h-full">
            <LoadingIcon />
          </div>
        ) : orderQuery.data ? (
          <OrderValueDistributionChart bins={orderQuery.data} className="h-full min-h-[350px]" />
        ) : null}
      </div>
    </div>
  );
}
