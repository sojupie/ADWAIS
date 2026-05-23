import type { GrowthExtreme } from '@types';
import type { CSSProperties } from 'react';
import { ChartPanel } from '../common/ChartPanel';
import './GrowthExtremesChart.css';

interface TenantRowData {
  tenantId: string;
  tenantName: string;
  growth: number;
  isNegative: boolean;
  barStyle: CSSProperties;
}

export function GrowthExtremesChart({tenants, onTenantSelect,}: 
{ tenants: GrowthExtreme[]; onTenantSelect?: (tenantId: string) => void; })
{
  if (tenants.length === 0) return null;
  
  const tenantsByGrowth = [...tenants];
  let minGrowth = 0;
  let maxGrowth = 0;
  for (const tenant of tenantsByGrowth) {
    if (tenant.growthPercentage < minGrowth) {
      minGrowth = tenant.growthPercentage;
    }

    if (tenant.growthPercentage > maxGrowth) {
      maxGrowth = tenant.growthPercentage;
    }
  }  
  const growthRange = maxGrowth - minGrowth || 1;
  const zeroPosition = Math.abs(minGrowth / growthRange) * 100;
  
  const ExtremeRows: TenantRowData[] = tenantsByGrowth.map((tenant) => {
    const growth = tenant.growthPercentage;
    const isNegative = growth < 0;
    const width = Math.abs(growth / growthRange) * 100;
    
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
      growth,
      isNegative,
      barStyle,
    };
  });

  return (
      <ChartPanel title="Growth Extremes" bodyClassName="extremes-chart">
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

function GrowthExtremesRowJSX({row, zeroPosition, onTenantSelect,}: {
  row: TenantRowData; zeroPosition: number; onTenantSelect?: (tenantId: string) => void; })
{
  const growthLabel = `${row.growth >= 0 ? '+' : ''}${row.growth.toFixed(1)}%`;
  let barClass = 'extremes-row__bar extremes-row__bar--positive';
  let valueClass = 'extremes-row__value';

  if (row.growth > 0) {
    valueClass = 'extremes-row__value text-green';
  } else if (row.isNegative) {
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
               title={growthLabel}/>
        </div>
        <span className={valueClass}>
          {growthLabel}
        </span>
      </button>
  );
}
