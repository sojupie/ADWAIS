import { useEffect, useMemo, useState } from 'react';
import { LoadingIcon } from '../common/LoadingIcon';
import './UptimeDashboard.css';

interface MonitorStatus {
  statusStr?: string;
  uptime?: number;
  lastResponseTime?: number | null;
}

interface UptimeMonitor {
  id: number;
  tenantId: string;
  name: string;
  url: string;
  uptimeSla: number | null;
  uptimeMonitorEnabled: boolean;
  creationDate: string | null;
  status?: MonitorStatus;
}

async function fetchMonitors(): Promise<UptimeMonitor[]> {
  const response = await fetch('/api/UptimeRobot/monitors');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - /api/UptimeRobot/monitors`);
  }

  return response.json() as Promise<UptimeMonitor[]>;
}

function normalizeStatus(status?: MonitorStatus): string {
  return (status?.statusStr ?? 'Unknown').replaceAll('"', '');
}

export function UptimeDashboard() {
  const [monitors, setMonitors] = useState<UptimeMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMonitors();
        if (!cancelled) {
          setMonitors(data);
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
  }, []);

  const summary = useMemo(() => {
    const up = monitors.filter((m) => normalizeStatus(m.status).toUpperCase() === 'UP').length;
    const enabled = monitors.filter((m) => m.uptimeMonitorEnabled).length;
    const responseTimes = monitors
      .map((m) => m.status?.lastResponseTime)
      .filter((value): value is number => typeof value === 'number');
    const averageResponseTime = responseTimes.length === 0
      ? null
      : Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length);

    return {
      total: monitors.length,
      up,
      enabled,
      averageResponseTime,
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
          <span className="uptime-stat__label">Avg Response</span>
          <strong className="uptime-stat__value">
            {summary.averageResponseTime === null ? 'N/A' : `${summary.averageResponseTime} ms`}
          </strong>
        </div>
      </section>

      <section className="card uptime-table-card" aria-label="Uptime monitors">
        <div className="uptime-table-card__header">
          <span className="uptime-table-card__title">Monitor Status</span>
          <span className="uptime-table-card__count">{monitors.length} monitors</span>
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
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((monitor) => {
                  const status = normalizeStatus(monitor.status);
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
                        {monitor.status?.lastResponseTime == null
                          ? 'N/A'
                          : `${monitor.status.lastResponseTime} ms`}
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
