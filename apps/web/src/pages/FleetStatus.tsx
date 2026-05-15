import { useEffect, useMemo, useState } from 'react';
import { CollectionPanel } from '../components/common/CollectionPanel';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { FleetMatrix, type FleetMonitor } from '../components/FleetStatus/FleetMatrix';
import './FleetStatus.css';

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

async function fetchTenantMonitors(tenant: Tenant): Promise<FleetMonitor[]> {
  const response = await fetch(`/api/tenants/${tenant.id}/monitors`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - /api/tenants/${tenant.id}/monitors`);
  }

  const monitors = await response.json() as UptimeMonitor[];
  return monitors.map((monitor) => ({
    ...monitor,
    tenantName: tenant.name,
  }));
}

function normalizeStatus(status?: string): string {
  return (status ?? 'Unknown').replaceAll('"', '');
}

function formatUptime(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }

  return `${value.toFixed(1)}%`;
}

export function FleetStatus() {
  const [monitors, setMonitors] = useState<FleetMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const tenants = await fetchTenants();
        const monitorGroups = await Promise.all(tenants.map((tenant) => fetchTenantMonitors(tenant)));
        const nextMonitors = monitorGroups
          .flat()
          .sort((a, b) => a.tenantName.localeCompare(b.tenantName) || a.name.localeCompare(b.name));

        if (!cancelled) {
          setMonitors(nextMonitors);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to fetch fleet status');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const enabled = monitors.filter((monitor) => monitor.uptimeMonitorEnabled).length;
    const up = monitors.filter((monitor) => normalizeStatus(monitor.currentStatus).toUpperCase() === 'UP').length;
    const down = enabled - up;
    const uptimeValues = monitors
      .map((monitor) => monitor.currentUptimePercentage)
      .filter((value): value is number => typeof value === 'number');
    const averageUptime = uptimeValues.length === 0
      ? null
      : uptimeValues.reduce((total, value) => total + value, 0) / uptimeValues.length;

    return {
      total: monitors.length,
      enabled,
      up,
      down,
      averageUptime,
    };
  }, [monitors]);

  if (loading) {
    return (
      <div className="fleet-status-loading">
        <LoadingIcon />
      </div>
    );
  }

  if (error) {
    return (
      <CollectionPanel title="Fleet Status">
        <div className="fleet-status-empty">
          <span>{error}</span>
        </div>
      </CollectionPanel>
    );
  }

  return (
    <section className="fleet-status-page" aria-label="Fleet status">
      <section className="fleet-status-kpi-row" aria-label="Fleet status summary">
        <FactPanel label="Monitors" value={summary.total.toString()} />
        <FactPanel label="Online" value={summary.up.toString()} valueColor={summary.down === 0 ? 'green' : 'red'} />
        <FactPanel label="Enabled" value={summary.enabled.toString()} />
        <FactPanel label="Average Uptime" value={formatUptime(summary.averageUptime)} />
      </section>

      <CollectionPanel
        title="Fleet Matrix"
        actions={<span className="fleet-status-summary">{summary.up}/{summary.enabled} online</span>}
        className="fleet-status-matrix-panel"
      >
        {monitors.length === 0 ? (
          <div className="fleet-status-empty">
            <span>No monitors found</span>
          </div>
        ) : (
          <FleetMatrix monitors={monitors} />
        )}
      </CollectionPanel>
    </section>
  );
}
