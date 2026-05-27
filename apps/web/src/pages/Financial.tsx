import { formatCurrency, formatCompact, formatNumber } from '@utils';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueDistributionChart } from '../components/financial/RevenueDistributionChart';
import { RevenueVelocityChart } from '../components/financial/RevenueVelocityChart';
import { ChartPanel } from '../components/common/ChartPanel';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TenantDiagnostics } from './TenantDiagnostics';
import { 
  useGlobalKpis, 
  useFinancialVelocity, 
  useGrowthExtremes, 
  useMomentum, 
  useRevenueDistribution
} from '../hooks/useFinancialQueries';

export function Financial() {
  const { timeframe, tenantId } = useSearch({ from: '/financial' });
  const navigate = useNavigate({ from: '/financial' });

  const kpiQuery = useGlobalKpis(timeframe);
  const velocityQuery = useFinancialVelocity(timeframe);
  const extremesQuery = useGrowthExtremes(timeframe);
  const momentumQuery = useMomentum(timeframe);
  const distributionQuery = useRevenueDistribution(timeframe);

  const selectedTenantName = useMemo(() => {
    if (!tenantId) return null;
    return extremesQuery.data?.find(e => e.tenantId === tenantId)?.tenantName 
      || distributionQuery.data?.find(d => d.tenantId === tenantId)?.tenantName 
      || momentumQuery.data?.tenants.find(t => t.tenantId === tenantId)?.tenantName
      || 'Unknown Tenant';
  }, [tenantId, extremesQuery.data, distributionQuery.data, momentumQuery.data]);

  if (tenantId && selectedTenantName) {
    return (
      <TenantDiagnostics
        tenantId={tenantId}
        tenantName={selectedTenantName}
        timeframe={timeframe}
        onBack={() => navigate({ search: (prev) => ({ ...prev, tenantId: undefined }) })}
      />
    );
  }

  const handleTenantSelect = (id: string) => {
    navigate({ search: (prev) => ({ ...prev, tenantId: id }) });
  };

  const placeholderData = [
    { name: 'A', value: 400 },
    { name: 'B', value: 300 },
    { name: 'C', value: 600 },
    { name: 'D', value: 200 },
    { name: 'E', value: 500 },
    { name: 'F', value: 350 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full min-h-full animate-in fade-in duration-700">
      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-shrink-0">
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
        />
        <FactPanel
          label="Portfolio AOV"
          value={kpiQuery.data ? `${formatCompact(kpiQuery.data.averageOrderValue)} SEK` : '\u2014'}
          isLoading={kpiQuery.isLoading}
        />
        <FactPanel
          label="Baseline Revenue"
          value={kpiQuery.data ? formatCurrency(kpiQuery.data.previousRevenue) : '\u2014'}
          isLoading={kpiQuery.isLoading}
        />
      </section>

      {/* Charts Grid: Strictly Responsive & Independent */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        {velocityQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center h-full"><LoadingIcon /></div>
        ) : velocityQuery.data ? (
          <RevenueVelocityChart points={velocityQuery.data} className="h-full min-h-[350px]" />
        ) : null}

        <ChartPanel title="Regional Growth (Placeholder)" className="h-full min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={placeholderData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="value" fill="#51B5B9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {distributionQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center h-full"><LoadingIcon /></div>
        ) : distributionQuery.data ? (
          <RevenueDistributionChart entries={distributionQuery.data} onTenantSelect={handleTenantSelect} className="h-full min-h-[350px]" />
        ) : null}

        {momentumQuery.isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center h-full"><LoadingIcon /></div>
        ) : momentumQuery.data ? (
          <MomentumMatrixChart momentum={momentumQuery.data} onTenantSelect={handleTenantSelect} className="h-full min-h-[350px]" />
        ) : null}
      </div>
    </div>
  );
}
