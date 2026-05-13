import { useEffect, useMemo, useState } from 'react';
import { LoadingIcon } from '../common/LoadingIcon';
import './UptimeDashboard.css';

interface Tenant {
  id: string;
  name: string;
}

interface UptimeMonitor {
  id: number;
  tenantId: string;
  name: string;
  url: string;
  uptimeSla: number | null;
  uptimeMonitorEnabled: boolean;
  currentStatus: string;
  currentUptimePercentage: number;
}

async function fetchTenants(): Promise<Tenant[]> {
  const response = await fetch('/api/admin/tenants');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - /api/admin/tenants`);
  }

  return response.json() as Promise<Tenant[]>;
}

async function fetchMonitors(tenantId: string): Promise<UptimeMonitor[]> {
  const response = await fetch(`/api/tenants/${tenantId}/monitors`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - /api/tenants/${tenantId}/monitors`);
  }

  return response.json() as Promise<UptimeMonitor[]>;
}

function normalizeStatus(status?: string): string {
  return (status ?? 'Unknown').replaceAll('"', '');
}

export function UptimeDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [monitors, setMonitors] = useState<UptimeMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const tenantData = await fetchTenants();
        const initialTenantId = selectedTenantId || tenantData[0]?.id || '';
        const monitorData = initialTenantId ? await fetchMonitors(initialTenantId) : [];

        if (!cancelled) {
          setTenants(tenantData);
          setSelectedTenantId(initialTenantId);
          setMonitors(monitorData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to fetch monitors');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedTenantId]);

  const summary = useMemo(() => {
    const up = monitors.filter((m) => normalizeStatus(m.currentStatus).toUpperCase() === 'UP').length;
    const enabled = monitors.filter((m) => m.uptimeMonitorEnabled).length;
    const uptimePercentages = monitors
      .map((m) => m.currentUptimePercentage)
      .filter((value): value is number => typeof value === 'number');
    const averageUptime = uptimePercentages.length === 0
      ? null
      : uptimePercentages.reduce((sum, value) => sum + value, 0) / uptimePercentages.length;

    return {
      total: monitors.length,
      up,
      enabled,
      averageUptime,
    };
  }, [monitors]);

  if (loading) {
    return (
      <div className="uptime-loading">
        <LoadingIcon />
      </div>
    );
  }

  if (error) {
    return (
      <div className="uptime-dashboard">
        <div className="card uptime-empty">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="uptime-dashboard">
      <section className="uptime-grid" aria-label="Uptime summary">
        <div className="card uptime-stat">
          <span className="uptime-stat__label">Monitors</span>
          <strong className="uptime-stat__value">{summary.total}</strong>
        </div>
        <div className="card uptime-stat">
          <span className="uptime-stat__label">Up</span>
          <strong className="uptime-stat__value uptime-stat__value--up">{summary.up}</strong>
        </div>
        <div className="card uptime-stat">
          <span className="uptime-stat__label">Enabled</span>
          <strong className="uptime-stat__value">{summary.enabled}</strong>
        </div>
        <div className="card uptime-stat">
          <span className="uptime-stat__label">Avg Uptime</span>
          <strong className="uptime-stat__value">
            {summary.averageUptime === null ? 'N/A' : `${summary.averageUptime.toFixed(1)}%`}
          </strong>
        </div>
      </section>

      <section className="card uptime-table-card" aria-label="Uptime monitors">
        <div className="uptime-table-card__header">
          <span className="uptime-table-card__title">Monitor Status</span>
          <div className="uptime-table-card__controls">
            {tenants.length > 0 && (
              <select
                className="uptime-tenant-select"
                value={selectedTenantId}
                onChange={(event) => setSelectedTenantId(event.target.value)}
                aria-label="Select tenant"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            )}
            <span className="uptime-table-card__count">{monitors.length} monitors</span>
          </div>
        </div>

        {monitors.length === 0 ? (
          <div className="uptime-empty">
            <span>No monitors found</span>
          </div>
        ) : (
          <div className="uptime-table-wrap">
            <table className="uptime-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>URL</th>
                  <th>Enabled</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((monitor) => {
                  const status = normalizeStatus(monitor.currentStatus);
                  const isUp = status.toUpperCase() === 'UP';

                  return (
                    <tr key={monitor.id}>
                      <td className="uptime-table__name">{monitor.name}</td>
                      <td>
                        <span className={`uptime-status ${isUp ? 'uptime-status--up' : 'uptime-status--down'}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <a href={monitor.url} target="_blank" rel="noreferrer">
                          {monitor.url}
                        </a>
                      </td>
                      <td>{monitor.uptimeMonitorEnabled ? 'Yes' : 'No'}</td>
                      <td>
                        {`${monitor.currentUptimePercentage.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
