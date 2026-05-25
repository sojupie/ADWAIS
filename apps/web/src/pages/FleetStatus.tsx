import { CollectionPanel } from '../components/common/CollectionPanel';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { FleetMatrix } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart } from '../components/FleetStatus/NetworkLatencyChart';
import { SlaBreachWatchlist } from '../components/FleetStatus/SlaBreachWatchlist';
import { useDashboardData } from '../dashboardDataStore';
import './FleetStatus.css';

export function FleetStatus() {
  const {
    fleetLoading,
    fleetError,
    fleetMonitors,
    fleetLatencyPoints,
    fleetSummary,
  } = useDashboardData();

  if (fleetLoading) {
    return (
      <div className="fleet-status-loading">
        <LoadingIcon />
      </div>
    );
  }

  if (fleetError) {
    return (
      <CollectionPanel title="Fleet Status">
        <div className="fleet-status-empty">
          <span>{fleetError}</span>
        </div>
      </CollectionPanel>
    );
  }

  return (
    <section className="fleet-status-page" aria-label="Fleet status">
      <section className="fleet-status-kpi-row" aria-label="Fleet status summary">
        <FactPanel label="Monitors" value={fleetSummary.total.toString()} />
        <FactPanel label="Online" value={fleetSummary.up.toString()} valueColor={fleetSummary.down === 0 ? 'green' : 'red'} />
        <FactPanel label="Enabled" value={fleetSummary.enabled.toString()} />
        <FactPanel
          label="Average Uptime"
          value={`${fleetSummary.averageUptime.toFixed(2)}%`}
          valueColor={fleetSummary.averageUptime >= 99 ? 'green' : 'red'}
        />
      </section>

      <section className="fleet-status-chart-row" aria-label="Fleet status diagnostics">
        <NetworkLatencyChart points={fleetLatencyPoints} />
        <SlaBreachWatchlist monitors={fleetMonitors} />
      </section>

      <CollectionPanel
        title="Fleet Matrix"
        actions={<span className="fleet-status-summary">{fleetSummary.up}/{fleetSummary.enabled} online</span>}
        className="fleet-status-matrix-panel"
      >
        {fleetMonitors.length === 0 ? (
          <div className="fleet-status-empty">
            <span>No monitors found</span>
          </div>
        ) : (
          <FleetMatrix monitors={fleetMonitors} />
        )}
      </CollectionPanel>
    </section>
  );
}
