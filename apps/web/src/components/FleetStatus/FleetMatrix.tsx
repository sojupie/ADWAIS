import './FleetMatrix.css';

export interface FleetMonitor {
  id: number;
  tenantId: string;
  tenantName: string;
  name: string;
  url: string;
  uptimeSla: number | null;
  uptimeMonitorEnabled: boolean;
  currentStatus: string;
  currentUptimePercentage: number;
}

function normalizeStatus(status?: string): string {
  return (status ?? 'Unknown').replaceAll('"', '').trim();
}

function getStatusClass(monitor: FleetMonitor): string {
  const classes = ['fleet-matrix-tile'];

  if (normalizeStatus(monitor.currentStatus).toUpperCase() === 'UP') {
    classes.push('fleet-matrix-tile--up');
  } else {
    classes.push('fleet-matrix-tile--down');
  }

  if (!monitor.uptimeMonitorEnabled) {
    classes.push('fleet-matrix-tile--disabled');
  }

  return classes.join(' ');
}

function formatUptime(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function FleetMatrix({ monitors }: { monitors: FleetMonitor[] }) {
  return (
    <div className="fleet-matrix-grid">
      {monitors.map((monitor) => {
        const status = normalizeStatus(monitor.currentStatus);

        return (
          <a
            key={`${monitor.tenantId}-${monitor.id}`}
            className={getStatusClass(monitor)}
            href={monitor.url}
            target="_blank"
            rel="noreferrer"
            title={`${monitor.tenantName} - ${monitor.name}`}
          >
            <span className="fleet-matrix-tile__status">{status}</span>
            <strong>{monitor.name}</strong>
            <span>{monitor.url}</span>
            <span>{formatUptime(monitor.currentUptimePercentage)}</span>
          </a>
        );
      })}
    </div>
  );
}
