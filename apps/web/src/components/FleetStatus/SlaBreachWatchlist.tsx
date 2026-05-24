import { ChartPanel } from '../common/ChartPanel';
import type { FleetMonitor } from './FleetMatrix';
import './SlaBreachWatchlist.css';

interface TenantBreach {
  tenantId: string;
  tenantName: string;
  uptime: number;
  sla: number;
  monitorCount: number;
}

function buildBreaches(monitors: FleetMonitor[]): TenantBreach[] {
  const breaches = new Map<string, TenantBreach>();

  monitors
    .filter((monitor) =>
      monitor.uptimeMonitorEnabled
      && monitor.uptimeSla !== null
      && monitor.currentUptimePercentage < monitor.uptimeSla)
    .forEach((monitor) => {
      const existing = breaches.get(monitor.tenantId);

      if (!existing) {
        breaches.set(monitor.tenantId, {
          tenantId: monitor.tenantId,
          tenantName: monitor.tenantName,
          uptime: monitor.currentUptimePercentage,
          sla: monitor.uptimeSla as number,
          monitorCount: 1,
        });
        return;
      }

      breaches.set(monitor.tenantId, {
        ...existing,
        uptime: Math.min(existing.uptime, monitor.currentUptimePercentage),
        sla: Math.max(existing.sla, monitor.uptimeSla as number),
        monitorCount: existing.monitorCount + 1,
      });
    });

  return Array.from(breaches.values())
    .sort((a, b) => (a.uptime - a.sla) - (b.uptime - b.sla))
    .slice(0, 6);
}

function formatUptime(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function SlaBreachWatchlist({ monitors }: { monitors: FleetMonitor[] }) {
  const breaches = buildBreaches(monitors);

  return (
    <ChartPanel
      title="SLA Breach Watchlist"
      bodyClassName="sla-breach-watchlist"
      legend={<span className="sla-breach-watchlist__count">{breaches.length} tenants</span>}
    >
      {breaches.length === 0 ? (
        <div className="sla-breach-watchlist__empty">No SLA breaches</div>
      ) : (
        <div className="sla-breach-watchlist__list">
          {breaches.map((tenant) => (
            <article className="sla-breach-watchlist__item" key={tenant.tenantId}>
              <div>
                <h3>{tenant.tenantName}</h3>
                <p>Uptime: <strong>{formatUptime(tenant.uptime)}</strong></p>
              </div>
              <div className="sla-breach-watchlist__meta">
                <span className="sla-breach-watchlist__badge">Degraded</span>
                <span>SLA: {formatUptime(tenant.sla)}</span>
                {tenant.monitorCount > 1 && <span>{tenant.monitorCount} monitors</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </ChartPanel>
  );
}
