import type { TenantKpi } from '@types';
import type { CSSProperties } from 'react';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
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
    <ChartPanel title="Revenue by Client" bodyClassName="extremes-chart">
      {sorted.map((t) => {
        const isNegative = t.totalRevenue < 0;
        const width = Math.abs(t.totalRevenue / revenueRange) * 100;
        let barClass = 'extremes-row__bar extremes-row__bar--positive';
        let valueClass = 'extremes-row__value text-green';
        let barStyle: CSSProperties = { left: `${zeroPosition}%`, width: `${width}%` };

        if (isNegative) {
          barClass = 'extremes-row__bar extremes-row__bar--negative';
          valueClass = 'extremes-row__value text-red';
          barStyle = { right: `${100 - zeroPosition}%`, width: `${width}%` };
        }

        return (
          <div key={t.tenantId} className="extremes-row">
            <span className="extremes-row__name text-secondary">{t.tenantName}</span>
            <div className="extremes-row__track">
              <span
                className="extremes-row__zero"
                style={{ left: `${zeroPosition}%` }}
              />
              <div
                className={barClass}
                style={barStyle}
                title={`${formatCompact(t.totalRevenue)} SEK`}
              />
            </div>
            <span className={valueClass}>
              {formatCompact(t.totalRevenue)}
            </span>
          </div>
        );
      })}
    </ChartPanel>
  );
}
