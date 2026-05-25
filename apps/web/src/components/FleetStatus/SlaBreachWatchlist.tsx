import { ChartPanel } from '../common/ChartPanel';
import type { FleetMonitor } from './FleetMatrix';
import './SlaBreachWatchlist.css';

interface MonitorIssue {
  tenantId: string;
  tenantName: string;
  status: string;
  lastSyncError: string | null;
  monitorCount: number;
}

function normalizeStatus(status?: string): string {
  return (status ?? 'Unknown').replaceAll('"', '').trim();
}

function buildIssues(monitors: FleetMonitor[]): MonitorIssue[] {
  const issues = new Map<string, MonitorIssue>();

  monitors
    .filter((monitor) =>
      monitor.uptimeMonitorEnabled
      && (normalizeStatus(monitor.currentStatus).toUpperCase() !== 'UP' || monitor.lastSyncError))
    .forEach((monitor) => {
      const existing = issues.get(monitor.tenantId);

      if (!existing) {
        issues.set(monitor.tenantId, {
          tenantId: monitor.tenantId,
          tenantName: monitor.tenantName,
          status: normalizeStatus(monitor.currentStatus),
          lastSyncError: monitor.lastSyncError,
          monitorCount: 1,
        });
        return;
      }

      issues.set(monitor.tenantId, {
        ...existing,
        lastSyncError: existing.lastSyncError ?? monitor.lastSyncError,
        monitorCount: existing.monitorCount + 1,
      });
    });

  return Array.from(issues.values())
    .sort((a, b) => b.monitorCount - a.monitorCount || a.tenantName.localeCompare(b.tenantName))
    .slice(0, 6);
}

export function SlaBreachWatchlist({ monitors }: { monitors: FleetMonitor[] }) {
  const issues = buildIssues(monitors);

  return (
    <ChartPanel
      title="Monitor Issue Watchlist"
      bodyClassName="sla-breach-watchlist"
      legend={<span className="sla-breach-watchlist__count">{issues.length} tenants</span>}
    >
      {issues.length === 0 ? (
        <div className="sla-breach-watchlist__empty">No monitor issues</div>
      ) : (
        <div className="sla-breach-watchlist__list">
          {issues.map((tenant) => (
            <article className="sla-breach-watchlist__item" key={tenant.tenantId}>
              <div>
                <h3>{tenant.tenantName}</h3>
                <p>Status: <strong>{tenant.status}</strong></p>
              </div>
              <div className="sla-breach-watchlist__meta">
                <span className="sla-breach-watchlist__badge">Issue</span>
                {tenant.lastSyncError && <span>{tenant.lastSyncError}</span>}
                {tenant.monitorCount > 1 && <span>{tenant.monitorCount} monitors</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </ChartPanel>
  );
}
