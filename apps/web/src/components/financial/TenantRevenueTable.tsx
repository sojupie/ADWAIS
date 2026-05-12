import { useState } from 'react';
import type { TenantKpi } from '@types';
import { formatNumber, formatCompact } from '@utils';
import './TenantRevenueTable.css';

interface Props {
  tenants: TenantKpi[];
}

type SortKey = 'tenantName' | 'totalRevenue' | 'totalVolume' | 'aov';
type SortDir = 'asc' | 'desc';

export function TenantRevenueTable({ tenants }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('totalRevenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = [...tenants].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'tenantName') {
      cmp = a.tenantName.localeCompare(b.tenantName);
    } else {
      cmp = a[sortKey] - b[sortKey];
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const maxRevenue = Math.max(...tenants.map((t) => t.totalRevenue), 1);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function sortIcon(key: SortKey) {
    if (key !== sortKey) return <span className="sort-icon neutral">⇅</span>;
    return <span className="sort-icon active">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  }

  return (
    <div className="tenant-table-wrap card">
      <div className="tenant-table-header">
        <span className="chart-card__title">Client Performance</span>
        <span className="text-muted" style={{ fontSize: 11 }}>{tenants.length} clients</span>
      </div>

      <div className="tenant-table-scroll">
        <table className="tenant-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-name col-sortable" onClick={() => handleSort('tenantName')}>
                Client {sortIcon('tenantName')}
              </th>
              <th className="col-revenue col-sortable" onClick={() => handleSort('totalRevenue')}>
                Revenue {sortIcon('totalRevenue')}
              </th>
              <th className="col-bar"></th>
              <th className="col-volume col-sortable" onClick={() => handleSort('totalVolume')}>
                Orders {sortIcon('totalVolume')}
              </th>
              <th className="col-aov col-sortable" onClick={() => handleSort('aov')}>
                AOV {sortIcon('aov')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const barPct = (t.totalRevenue / maxRevenue) * 100;
              return (
                <tr key={t.tenantId} className="tenant-row">
                  <td className="col-rank text-muted">{i + 1}</td>
                  <td className="col-name">{t.tenantName}</td>
                  <td className="col-revenue">
                    {formatCompact(t.totalRevenue)} SEK
                  </td>
                  <td className="col-bar">
                    <div className="inline-bar-track">
                      <div
                        className="inline-bar-fill"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </td>
                  <td className="col-volume text-secondary">{formatNumber(t.totalVolume)}</td>
                  <td className="col-aov text-secondary">{formatCompact(t.aov)} SEK</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
