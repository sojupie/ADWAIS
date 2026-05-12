import type { TenantKpi } from '@types';
import { formatCompact } from '@utils';
import './ChartCard.css';
import './GrowthExtremesChart.css';

interface Props {
  tenants: TenantKpi[];
}

export function GrowthExtremesChart({ tenants }: Props) {
  if (tenants.length === 0) return null;

  // Sort by revenue desc, take top 12
  const sorted = [...tenants]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 12);

  const maxRevenue = sorted[0]?.totalRevenue ?? 1;

  return (
    <div className="chart-card card">
      <div className="chart-card__header">
        <span className="chart-card__title">Revenue by Client</span>
        <div className="chart-card__legend">
          <span className="chart-card__legend-dot" style={{ background: 'var(--chart-line)' }} />
          <span>Revenue</span>
        </div>
      </div>

      <div className="chart-card__body extremes-chart">
        {sorted.map((t) => {
          const pct = maxRevenue > 0 ? (t.totalRevenue / maxRevenue) * 100 : 0;
          return (
            <div key={t.tenantId} className="extremes-row">
              <span className="extremes-row__name text-secondary">{t.tenantName}</span>
              <div className="extremes-row__track">
                <div
                  className="extremes-row__bar"
                  style={{ width: `${pct}%` }}
                  title={`${formatCompact(t.totalRevenue)} SEK`}
                />
              </div>
              <span className="extremes-row__value text-muted">
                {formatCompact(t.totalRevenue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
