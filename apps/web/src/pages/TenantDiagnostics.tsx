import type { TenantDiagnostics as TenantDiagnosticsData } from '@types';
import { formatCurrency, formatNumber } from '@utils';
import { FactPanel } from '../components/common/FactPanel';
import { CumulativeGrowthDeltaChart } from '../components/TenantSpecific/CumulativeGrowthDeltaChart';
import { OrderValueDistributionChart } from '../components/TenantSpecific/OrderValueDistributionChart';
import { PortfolioRevenueShareTrajectoryChart } from '../components/TenantSpecific/PortfolioRevenueShareTrajectoryChart';
import { TenantRevenueVelocityChart } from '../components/TenantSpecific/TenantRevenueVelocityChart';
import './TenantDiagnostics.css';

interface Props {
  data: TenantDiagnosticsData;
  onBack: () => void;
}

export function TenantDiagnostics({ data, onBack }: Props) {
  const growthColor = data.revenuePoP > 0 ? 'green' : data.revenuePoP < 0 ? 'red' : undefined;

  return (
    <div className="tenant-diagnostics">
      <header className="tenant-diagnostics__header">
        <button
          className="tenant-diagnostics__back"
          type="button"
          onClick={onBack}
          aria-label="Back to financial overview"
        >
          &lt;
        </button>
        <div>
          <h1>{data.tenantName} Diagnostics</h1>
          <p>Isolated entity performance view.</p>
        </div>
      </header>

      <section className="tenant-diagnostics__kpis" aria-label="Tenant key performance indicators">
        <FactPanel
          label={`Revenue (T${data.days})`}
          value={formatCurrency(data.totalRevenue)}
        />
        <FactPanel
          label={`Growth (vs P${data.days})`}
          value={`${data.revenuePoP >= 0 ? '+' : ''}${data.revenuePoP.toFixed(2)}%`}
          valueColor={growthColor}
        />
        <FactPanel
          label="Transaction Volume"
          value={formatNumber(data.totalVolume)}
        />
        <FactPanel
          label="Average Order Value"
          value={formatCurrency(data.aov)}
        />
      </section>

      <section className="tenant-diagnostics__charts tenant-diagnostics__charts--primary" aria-label="Tenant revenue diagnostics">
        <TenantRevenueVelocityChart daily={data.daily} />
        <PortfolioRevenueShareTrajectoryChart daily={data.daily} />
      </section>

      <section className="tenant-diagnostics__charts" aria-label="Tenant order diagnostics">
        <CumulativeGrowthDeltaChart daily={data.daily} />
        <OrderValueDistributionChart buckets={data.orderValueDistribution} />
      </section>
    </div>
  );
}
