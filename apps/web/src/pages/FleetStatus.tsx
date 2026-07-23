import { CollectionPanel } from '../components/common/dashboard/CollectionPanel';
import { FleetMatrix } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart } from '../components/FleetStatus/NetworkLatencyChart';
import { FleetSelectionPanel } from '../components/FleetStatus/FleetSelectionPanel';
import { DashboardLayout } from "../components/common/layout/DashboardLayout.tsx";
import { DashboardFlexRow } from "../components/common/layout/DashboardFlexRow.tsx";
import { DashboardFooter } from "../components/common/layout/DashboardFooter.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import { useFleetStatusViewModel } from "../hooks/useFleetStatusViewModel.ts";
import { EmptyState } from "../components/common/ui/EmptyState.tsx";
import { FleetFilterMenu, FleetFilterPanel } from '../components/FleetStatus/FleetFilterMenu.tsx';
import { MobileFooterActions } from '../components/common/ui/MobileFooterActions.tsx';
import { countActiveFilterGroups } from '../utils/filterCounts.ts';

const EMPTY_LATENCY: never[] = [];

export function FleetStatus() {
  const vm = useFleetStatusViewModel();
  const matrixActions = (
    <span className="text-sm font-bold text-on-surface-variant">
      {vm.fleetStats.enabled.length} Online
    </span>
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
      {/* Main Content Grid: Matrix on Left, selected scope & latency on Right */}
      <DashboardFlexRow weight="flex-1" gridCols="5" className="landscape-contained:min-h-0">

        {/* Right Column: Selected scope (Top) & Latency Chart (Bottom) (Takes 40% of width) */}
        <div className="landscape-lg:col-span-2 flex flex-col gap-4 min-h-[500px] contained:min-h-0 contained:h-full portrait-contained:contents">

          <FleetSelectionPanel
            selection={vm.selection}
            selectedTenantName={vm.selectedTenantName}
            selectedMonitor={vm.selectedMonitor}
            scopedMonitors={vm.scopedMonitors}
            availability={vm.availabilityQuery.data}
            isLoading={vm.availabilityQuery.isLoading}
            isStale={vm.availabilityQuery.isPlaceholderData}
            averageLatency={vm.fleetStats.avgLatency}
            p10Latency={vm.fleetStats.lowestLatency}
            p90Latency={vm.fleetStats.highestLatency}
            uptimeGrowth={vm.fleetStats.uptimeGrowth}
            latencyGrowth={vm.fleetStats.latencyGrowth}
            p10LatencyGrowth={vm.fleetStats.lowestLatencyGrowth}
            p90LatencyGrowth={vm.fleetStats.highestLatencyGrowth}
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
        <div className="flex shrink-0 items-center">
          <SyncStatusWidget />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <FleetFilterMenu
            monitors={vm.allMonitors}
            availableTags={vm.availableTags}
            selection={vm.selection}
            selectedTags={vm.selectedTags}
            selectedStatuses={vm.selectedStatuses}
            onSelectionChange={vm.setSelection}
            onTagsChange={vm.setSelectedTags}
            onStatusesChange={vm.setSelectedStatuses}
            onClearAll={vm.resetFilters}
          />
          <div className="w-px h-6 bg-outline-variant mx-1 shrink-0" aria-hidden="true" />
          <PeriodSelector from="/fleet-status" />
        </div>
      </DashboardFooter>

      <MobileFooterActions
        activeCount={countActiveFilterGroups(
          Boolean(vm.selection?.tenantId),
          vm.selection?.monitorId != null,
          vm.selectedTags.length > 0,
          vm.selectedStatuses.length > 0,
        )}
        clearLabel="Reset all fleet filters"
        onClearAll={vm.resetFilters}
      >
        <FleetFilterPanel
          embedded
          monitors={vm.allMonitors}
          availableTags={vm.availableTags}
          selection={vm.selection}
          selectedTags={vm.selectedTags}
          selectedStatuses={vm.selectedStatuses}
          onSelectionChange={vm.setSelection}
          onTagsChange={vm.setSelectedTags}
          onStatusesChange={vm.setSelectedStatuses}
        />
      </MobileFooterActions>
    </DashboardLayout>
  );
}
