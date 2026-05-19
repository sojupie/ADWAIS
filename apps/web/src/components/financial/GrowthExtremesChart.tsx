import type { TenantKpi } from '@types';
import type { CSSProperties } from 'react';
import { formatCompact } from '@utils';
import { ChartPanel } from '../common/ChartPanel';
import './GrowthExtremesChart.css';

//need to adjust later since we probably wont have negative revenue
//will use red for when revenue is less than previous period instead
interface TenantRowData {
  tenantId: string;
  tenantName: string;
  formattedRevenue: string;
  isNegative: boolean;
  barStyle: CSSProperties;
}

export function GrowthExtremesChart({
  tenants,
  onTenantSelect,
}: {
  tenants: TenantKpi[];
  onTenantSelect?: (tenantId: string) => void;
}) {
  if (tenants.length === 0) return null;
  const sortedTenants = [...tenants]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0,10);

  let minRevenue = 0;
  let maxRevenue = 0;
  for (const tenant of sortedTenants) {
    if (tenant.totalRevenue < minRevenue) {
      minRevenue = tenant.totalRevenue;
    }
    if (tenant.totalRevenue > maxRevenue) {
      maxRevenue = tenant.totalRevenue;
    }
  }
  const revenueRange = maxRevenue - minRevenue || 1;
  const zeroPosition = Math.abs(minRevenue / revenueRange) * 100;

  const ExtremeRows: TenantRowData[] = sortedTenants.map((tenant) => {
    const isNegative = tenant.totalRevenue < 0;
    const width = Math.abs(tenant.totalRevenue / revenueRange) * 100;

    let barStyle: CSSProperties = {
      left: `${zeroPosition}%`,
      width: `${width}%`,
    };

    if (isNegative) {
      barStyle = {
        right: `${100 - zeroPosition}%`,
        width: `${width}%`,
      };
    }

    return {
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      formattedRevenue: formatCompact(tenant.totalRevenue),
      isNegative,
      barStyle,
    };
  });

  return (
      <ChartPanel title="Revenue by Client" bodyClassName="extremes-chart">
        {ExtremeRows.map((ExtremeRow) => (
            <GrowthExtremesRowJSX
                key={ExtremeRow.tenantId}
                row={ExtremeRow}
                zeroPosition={zeroPosition}
                onTenantSelect={onTenantSelect}
            />
        ))}
      </ChartPanel>
  );
}

function GrowthExtremesRowJSX({
  row,
  zeroPosition,
  onTenantSelect,
}: {
  row: TenantRowData;
  zeroPosition: number;
  onTenantSelect?: (tenantId: string) => void;
})
{
  let barClass = 'extremes-row__bar extremes-row__bar--positive';
  let valueClass = 'extremes-row__value text-green';

  if (row.isNegative) {
    barClass = 'extremes-row__bar extremes-row__bar--negative';
    valueClass = 'extremes-row__value text-red';
  }

  return (
      <button
          className={`extremes-row ${onTenantSelect ? 'extremes-row--clickable' : ''}`}
          type="button"
          onClick={() => onTenantSelect?.(row.tenantId)}
      >
        <span className="extremes-row__name text-secondary">
          {row.tenantName}
        </span>
        <div className="extremes-row__track">
          <span className="extremes-row__zero" style={{ left: `${zeroPosition}%` }}/>
          <div className={barClass}
               style={row.barStyle}
               title={`${row.formattedRevenue} SEK`}/>
        </div>
        <span className={valueClass}>
          {row.formattedRevenue}
        </span>
      </button>
  );
}
