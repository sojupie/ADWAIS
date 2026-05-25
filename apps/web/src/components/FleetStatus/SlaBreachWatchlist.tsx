import { ChartPanel } from '../common/ChartPanel';
import type { FleetMonitor } from './FleetMatrix';
import './SlaBreachWatchlist.css';

interface MonitorIssue {
  tenantId: string;
  tenantName: string;
  uptime: number;
  uptimeSla: number;
  monitorCount: number;
}

function buildIssues(monitors: FleetMonitor[]): MonitorIssue[] {
  const issues = new Map<string, MonitorIssue>();

  monitors
    .filter((monitor) =>
      monitor.uptimeMonitorEnabled
      && monitor.uptimeSla !== null
      && monitor.currentUptimePercentage < monitor.uptimeSla)
    .forEach((monitor) => {
      const existing = issues.get(monitor.tenantId);

      if (!existing) {
        issues.set(monitor.tenantId, {
          tenantId: monitor.tenantId,
          tenantName: monitor.tenantName,
          uptime: monitor.currentUptimePercentage,
          uptimeSla: monitor.uptimeSla ?? 0,
          monitorCount: 1,
        });
        return;
      }

      issues.set(monitor.tenantId, {
        ...existing,
        uptime: Math.min(existing.uptime, monitor.currentUptimePercentage),
        uptimeSla: Math.max(existing.uptimeSla, monitor.uptimeSla ?? 0),
        monitorCount: existing.monitorCount + 1,
      });
    });

  return Array.from(issues.values())
    .sort((a, b) => (a.uptime - a.uptimeSla) - (b.uptime - b.uptimeSla) || a.tenantName.localeCompare(b.tenantName))
    .slice(0, 6);
}

export function SlaBreachWatchlist({ monitors }: { monitors: FleetMonitor[] }) {
  const issues = buildIssues(monitors);

  return (
    <ChartPanel
      title="SLA Breach Watchlist"
      bodyClassName="sla-breach-watchlist"
      legend={<span className="sla-breach-watchlist__count">{issues.length} tenants</span>}
    >
      {issues.length === 0 ? (
        <div className="sla-breach-watchlist__empty">No SLA breaches</div>
      ) : (
        <div className="sla-breach-watchlist__list">
          {issues.map((tenant) => (
            <article className="sla-breach-watchlist__item" key={tenant.tenantId}>
              <div>
                <h3>{tenant.tenantName}</h3>
                <p>Uptime: <strong>{tenant.uptime.toFixed(2)}%</strong></p>
              </div>
              <div className="sla-breach-watchlist__meta">
                <span className="sla-breach-watchlist__badge">Breach</span>
                <span>SLA {tenant.uptimeSla.toFixed(2)}%</span>
                {tenant.monitorCount > 1 && <span>{tenant.monitorCount} monitors</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </ChartPanel>
  );
}
