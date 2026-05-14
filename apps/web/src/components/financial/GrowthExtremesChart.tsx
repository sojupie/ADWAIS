import type { TenantKpi } from '@types';
import { formatCompact } from '@utils';
import '../common/ChartPanel.css';
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

  const minRevenue = Math.min(...sorted.map((t) => t.totalRevenue), 0);
  const maxRevenue = Math.max(...sorted.map((t) => t.totalRevenue), 0);
  const revenueRange = maxRevenue - minRevenue || 1;
  const zeroPosition = Math.abs(minRevenue / revenueRange) * 100;

  return (
    <div className="chart-panel card">
      <div className="chart-panel__header">
        <span className="chart-panel__title">Revenue by Client</span>
      </div>

      <div className="chart-panel__body extremes-chart">
        {sorted.map((t) => {
          const isNegative = t.totalRevenue < 0;
          const width = Math.abs(t.totalRevenue / revenueRange) * 100;
          const barStyle = isNegative
            ? { right: `${100 - zeroPosition}%`, width: `${width}%` }
            : { left: `${zeroPosition}%`, width: `${width}%` };

          return (
            <div key={t.tenantId} className="extremes-row">
              <span className="extremes-row__name text-secondary">{t.tenantName}</span>
              <div className="extremes-row__track">
                <span
                  className="extremes-row__zero"
                  style={{ left: `${zeroPosition}%` }}
                />
                <div
                  className={`extremes-row__bar ${isNegative ? 'extremes-row__bar--negative' : 'extremes-row__bar--positive'}`}
                  style={barStyle}
                  title={`${formatCompact(t.totalRevenue)} SEK`}
                />
              </div>
              <span className={`extremes-row__value ${isNegative ? 'extremes-row__value--negative' : 'extremes-row__value--positive'}`}>
                {formatCompact(t.totalRevenue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
