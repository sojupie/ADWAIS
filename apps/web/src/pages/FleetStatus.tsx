import { CollectionPanel } from '../components/common/dashboard/CollectionPanel';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { FleetMatrix } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart } from '../components/FleetStatus/NetworkLatencyChart';
import { SlaBreachWatchlist } from '../components/FleetStatus/SlaBreachWatchlist';
import { DashboardLayout } from "../components/common/layout/DashboardLayout.tsx";
import { DashboardTopRow } from "../components/common/layout/DashboardTopRow.tsx";
import { DashboardFlexRow } from "../components/common/layout/DashboardFlexRow.tsx";
import { DashboardFooter } from "../components/common/layout/DashboardFooter.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { useFleetStatusViewModel } from "../hooks/useFleetStatusViewModel.ts";
import { EmptyState } from "../components/common/ui/EmptyState.tsx";

const EMPTY_LATENCY: never[] = [];

export function FleetStatus() {
  const vm = useFleetStatusViewModel();

  const matrixActions = (
    <div className="flex items-center gap-4">
      <button
        onClick={() => vm.setSelection(null)}
        disabled={!vm.selection}
        className="bg-surface-container-low hover:m3-elevation-2 m3-elevation-1 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all cursor-pointer disabled:m3-elevation-0 disabled:text-slate-400 disabled:bg-slate-200 disabled:cursor-not-allowed"
      >
        CLEAR
      </button>
      <span className="text-sm font-bold text-on-surface-variant">
        {vm.fleetStats.enabled.length} Online
      </span>
    </div>
  );

  const matrixContent = vm.tenantMonitors.length === 0 ? (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <EmptyState
        variant="minimal"
        message={vm.selection ? "No monitors found for this tenant" : "No monitors found in the fleet"}
      />
    </div>
  ) : (
    <FleetMatrix
      monitors={vm.tenantMonitors}
      onMonitorSelect={vm.handleMonitorSelect}
      selectedMonitorId={vm.selection?.monitorId}
    />
  );

  return (
    <DashboardLayout>
      <div className="min-w-0">
        <div className="flex items-center gap-6 mb-1">
          <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Fleet Status</h1>
        </div>
        <p className="text-sm text-on-surface-variant m-0 font-medium tracking-wide">Endpoint status, uptime%, and response time.</p>
      </div>
      {/* Top Row: Macro Stats */}
      <DashboardTopRow>
        <FactPanel
          label={`Uptime: ${vm.activeScopeName}`}
          value={vm.globalMonitorsQuery.isLoading ? '...' : (vm.fleetStats.avgUptime !== null && vm.fleetStats.avgUptime !== undefined ? `${vm.fleetStats.avgUptime.toFixed(3)}%` : 'N/A')}
          isLoading={vm.globalMonitorsQuery.isLoading || vm.analyticsQuery.isLoading}
          extra={vm.fleetStats.avgUptime !== null && vm.fleetStats.avgUptime !== undefined
            ? { type: 'PoP', value: vm.fleetStats.uptimeGrowth }
            : undefined}
          hasExtra={true}
        />

        <FactPanel
          label={`Latency: ${vm.activeScopeName}`}
          value={vm.analyticsQuery.isLoading ? '...' : `${Math.round(vm.fleetStats.avgLatency)}ms`}
          isLoading={vm.analyticsQuery.isLoading}
          extra={vm.fleetStats.avgLatency > 0
            ? { type: 'PoP', value: vm.fleetStats.latencyGrowth }
            : undefined}
          hasExtra={true}
          inverseTrend={true}
        />

        <FactPanel
          label={`90th Percentile`}
          value={vm.analyticsQuery.isLoading ? '...' : `${Math.round(vm.fleetStats.highestLatency)}ms`}
          isLoading={vm.analyticsQuery.isLoading}
          valueColor="red"
          extra={vm.fleetStats.highestLatency > 0
            ? { type: 'PoP', value: vm.fleetStats.highestLatencyGrowth }
            : undefined}
          hasExtra={true}
          inverseTrend={true}
        />

        <FactPanel
          label={`10th Percentile`}
          value={vm.analyticsQuery.isLoading ? '...' : `${Math.round(vm.fleetStats.lowestLatency)}ms`}
          isLoading={vm.analyticsQuery.isLoading}
          valueColor="green"
          extra={vm.fleetStats.lowestLatency > 0
            ? { type: 'PoP', value: vm.fleetStats.lowestLatencyGrowth }
            : undefined}
          hasExtra={true}
          inverseTrend={true}
        />

        <FactPanel label="Active Incidents">
          <div className="flex items-baseline gap-12">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl lg:text-3xl xl:text-2xl 2xl:text-4xl font-extrabold tracking-tight text-status-down">{vm.fleetStats.down.length}</span>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">DOWN</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-2xl lg:text-3xl xl:text-2xl 2xl:text-4xl font-extrabold tracking-tight text-status-degraded">{vm.fleetStats.degraded.length}</span>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">DEGRADED</span>
            </div>
          </div>
        </FactPanel>

      </DashboardTopRow>

      {/* Main Content Grid: Matrix on Left, Watchlist & Latency on Right */}
      <DashboardFlexRow weight="flex-1" gridCols="5" className="landscape-contained:min-h-0">

        {/* Right Column: Watchlist (Top) & Latency Chart (Bottom) (Takes 40% of width) */}
        <div className="landscape-lg:col-span-2 flex flex-col gap-4 min-h-[500px] contained:min-h-0 contained:h-full">

          <SlaBreachWatchlist
            monitors={vm.scopedMonitors}
            defaultSla={vm.defaultSla}
            defaultDegradedFloor={vm.defaultDegradedFloor}
            onMonitorSelect={vm.handleMonitorSelect}
            selectedMonitorId={vm.selection?.monitorId}
            onClearSelection={() => vm.setSelection(null)}
            hasActiveSelection={!!vm.selection}
            className="flex-1 min-h-[350px] contained:min-h-0 max-h-[600px] xl:max-h-none"
          />

          <NetworkLatencyChart
            points={vm.analyticsQuery.data?.latencyPoints || EMPTY_LATENCY}
            title={`Latency: ${vm.activeScopeName}`}
            isLoading={vm.analyticsQuery.isLoading}
            isStale={vm.analyticsQuery.isPlaceholderData}
            comparison="Preceding"
            className="flex-1 min-h-[350px] contained:min-h-0"
          />

        </div>

        {/* Left Column: Fleet Matrix (Takes 60% of width on landscape lg screens) */}
        <div className="landscape-lg:col-span-3 flex flex-col min-h-[500px] contained:min-h-0 contained:h-full">
          <CollectionPanel
              title={vm.selection ? `${vm.selectedTenantName} Monitors` : "Endpoint status – Click to select a tenant"}
              className="flex-grow min-h-[59px]"
              isLoading={vm.globalMonitorsQuery.isLoading}
              actions={matrixActions}
              titleClassName={"!text-sm !md:text-md"}
          >
            <div className="px-4 pb-4 h-full flex flex-col min-h-0">
              {matrixContent}
            </div>
          </CollectionPanel>
        </div>
      </DashboardFlexRow>

      {/* ── Footer Widgets (All Resolutions) ── */}
      <DashboardFooter>
        <SyncStatusWidget />
        <PeriodSelector from="/fleet-status" />
      </DashboardFooter>
    </DashboardLayout>
  );
}
