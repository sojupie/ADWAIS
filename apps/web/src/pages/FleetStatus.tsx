import { useEffect, useMemo, useState } from 'react';
import { CollectionPanel } from '../components/common/CollectionPanel';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { FleetMatrix, type FleetMonitor } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart, type LatencyPoint } from '../components/FleetStatus/NetworkLatencyChart';
import { SlaBreachWatchlist } from '../components/FleetStatus/SlaBreachWatchlist';
import './FleetStatus.css';


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

interface TenantResponse {
  id: string;
  name: string;
}

interface LatencyMetricsResponse {
  date: string;
  average: number | null;
  lowest: number | null;
  highest: number | null;
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

//will move this later
async function fetchMonitors(): Promise<FleetMonitor[]> {
  const [monitorsResponse, tenantsResponse] = await Promise.all([
    fetch('/api/monitors'),
    fetch('/api/tenants'),
  ]);

  if (!monitorsResponse.ok) {
    throw new Error(`HTTP ${monitorsResponse.status} - /api/monitors`);
  }

  if (!tenantsResponse.ok) {
    throw new Error(`HTTP ${tenantsResponse.status} - /api/tenants`);
  }

  const [monitors, tenants] = await Promise.all([
    monitorsResponse.json() as Promise<UptimeMonitor[]>,
    tenantsResponse.json() as Promise<TenantResponse[]>,
  ]);
  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  return monitors.map((monitor) => ({
    ...monitor,
    tenantName: tenantNames.get(monitor.tenantId) ?? monitor.tenantId,
  }));
}

async function fetchLatencySeries(monitors: FleetMonitor[], signal: AbortSignal): Promise<LatencyPoint[]> {
  const enabledMonitors = monitors.filter((monitor) => monitor.uptimeMonitorEnabled);
  if (enabledMonitors.length === 0) return [];

  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const query = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

  const responses = await Promise.all(
    enabledMonitors.map(async (monitor) => {
      const response = await fetch(
        `/api/monitors/${monitor.id}/latency?${query}&tenantId=${encodeURIComponent(monitor.tenantId)}`,
        { signal },
      );

      if (!response.ok) return [];

      const metrics = await response.json() as LatencyMetricsResponse[];
      return metrics
        .filter((metric) => metric.average !== null)
        .map((metric) => ({
          date: metric.date,
          average: metric.average as number,
          monitorId: monitor.id,
          tenantId: monitor.tenantId,
        }));
    }),
  );

  const buckets = new Map<string, number[]>();

  responses.flat().forEach((metric) => {
    const date = new Date(metric.date);
    date.setMinutes(0, 0, 0);
    const key = date.toISOString();
    const values = buckets.get(key) ?? [];
    values.push(metric.average);
    buckets.set(key, values);
  });

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({
      periodLabel: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      averageLatency: average(values),
      p95Latency: percentile(values, 0.95),
    }));
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function FleetStatus() {
  const [monitors, setMonitors] = useState<FleetMonitor[]>([]);
  const [latencyPoints, setLatencyPoints] = useState<LatencyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextMonitors = await fetchMonitors();
        nextMonitors.sort((a, b) =>
            a.tenantName.localeCompare(b.tenantName) || a.name.localeCompare(b.name));
        
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

  useEffect(() => {
    if (monitors.length === 0) {
      setLatencyPoints([]);
      return;
    }

    const controller = new AbortController();

    async function loadLatency() {
      try {
        const points = await fetchLatencySeries(monitors, controller.signal);
        if (!controller.signal.aborted) {
          setLatencyPoints(points);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLatencyPoints([]);
        }
      }
    }

    void loadLatency();

    return () => controller.abort();
  }, [monitors]);

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

      <section className="fleet-status-chart-row" aria-label="Fleet status diagnostics">
        <NetworkLatencyChart points={latencyPoints} />
        <SlaBreachWatchlist monitors={monitors} />
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
