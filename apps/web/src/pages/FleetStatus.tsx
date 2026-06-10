import { ArrowLeft } from 'lucide-react';
import { CollectionPanel } from '../components/common/dashboard/CollectionPanel';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { FleetMatrix } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart } from '../components/FleetStatus/NetworkLatencyChart';
import { SlaBreachWatchlist } from '../components/FleetStatus/SlaBreachWatchlist';
import {DashboardLayout} from "../components/common/layout/DashboardLayout.tsx";
import {DashboardTopRow} from "../components/common/layout/DashboardTopRow.tsx";
import {DashboardFlexRow} from "../components/common/layout/DashboardFlexRow.tsx";
import { SyncStatusWidget } from '../components/common/dashboard/SyncStatusWidget';
import { PeriodSelector } from '../components/common/charts/PeriodSelector';
import {useFleetStatusViewModel} from "../hooks/useFleetStatusViewModel.ts";
import {EmptyState} from "../components/common/ui/EmptyState.tsx";

const EMPTY_LATENCY: never[] = [];

export function FleetStatus() {
  const vm = useFleetStatusViewModel();

  const matrixActions = (
    <div className="flex items-center gap-6">
      {vm.selection && (
        <button 
          onClick={() => vm.setSelection(null)}
          className="bg-brand-bg-secondary border border-brand-bg-secondary px-3 py-1.5 rounded-sm text-[11px] font-extrabold text-white hover:bg-brand-text hover:border-brand-text uppercase tracking-widest transition-all shadow-sm"
        >
          <ArrowLeft size={14} className="mr-1 inline-block -mt-0.5 stroke-[3px]" /> BACK TO GLOBAL
        </button>
      )}
      <span className="text-[13px] font-bold text-[#64748b]">
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
      {/* Top Row: Macro Stats */}
      <DashboardTopRow>
        <FactPanel
          label={`Uptime: ${vm.activeScopeName}`}
          value={vm.globalMonitorsQuery.isLoading ? '...' : `${vm.fleetStats.avgUptime.toFixed(3)}%`}
          isLoading={vm.globalMonitorsQuery.isLoading}
        />
        
        <FactPanel
          label={`Latency: ${vm.activeScopeName}`}
          value={vm.analyticsQuery.isLoading ? '...' : `${Math.round(vm.fleetStats.avgLatency)}ms`}
          isLoading={vm.analyticsQuery.isLoading}
        />

        <FactPanel
          label={`Highest Latency`}
          value={vm.analyticsQuery.isLoading ? '...' : `${Math.round(vm.fleetStats.highestLatency)}ms`}
          isLoading={vm.analyticsQuery.isLoading}
          valueColor="red"
        />

        <FactPanel
          label={`Lowest Latency`}
          value={vm.analyticsQuery.isLoading ? '...' : `${Math.round(vm.fleetStats.lowestLatency)}ms`}
          isLoading={vm.analyticsQuery.isLoading}
          valueColor="green"
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-center min-h-22.5">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Incidents</h2>
          <div className="flex items-baseline gap-6">
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-extrabold tracking-tight text-red-500">{vm.fleetStats.down.length}</span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DOWN</span>
            </div>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-extrabold tracking-tight text-amber-500">{vm.fleetStats.degraded.length}</span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DEGRADED</span>
            </div>
          </div>
        </div>

      </DashboardTopRow>

      {/* Main Content Grid: Matrix on Left, Watchlist & Latency on Right */}
      <DashboardFlexRow weight="flex-1" gridCols="5">

        {/* Left Column: Fleet Matrix (Takes 60% of width on lg screens) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <CollectionPanel
            title={vm.selection ? `${vm.selectedTenantName} Monitors` : "Fleet Status Matrix"}
            className="h-full min-h-0"
            isLoading={vm.globalMonitorsQuery.isLoading}
            actions={matrixActions}
          >
            <div className="px-4 py-3 h-full flex flex-col min-h-0">
              {matrixContent}
            </div>
          </CollectionPanel>
        </div>

        {/* Right Column: Watchlist (Top) & Latency Chart (Bottom) (Takes 40% of width) */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full min-h-0">
          
          <SlaBreachWatchlist
             monitors={vm.scopedMonitors}
             onClearSelection={vm.selection ? () => vm.setSelection(null) : undefined}
          />

          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col min-h-0 relative overflow-hidden">
              {vm.analyticsQuery.isPlaceholderData && !vm.analyticsQuery.isLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
                     <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin opacity-80" />
                     <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mt-2 bg-white/80 px-2 py-1 rounded">Updating...</span>
                  </div>
              )}
              <NetworkLatencyChart 
                 points={vm.analyticsQuery.data?.latencyPoints || EMPTY_LATENCY}
                 title={`Latency: ${vm.activeScopeName}`}
                 isLoading={vm.analyticsQuery.isLoading}
                 comparison="Preceding"
              />
          </div>

        </div>
      </DashboardFlexRow>

      {/* ── Inline Widgets (Mobile/Tablet) ── */}
      <div className="xl:hidden flex flex-col md:flex-row justify-center gap-6 items-center w-full pb-6 shrink-0">
        <SyncStatusWidget />
        <PeriodSelector from="/fleet-status" />
      </div>

      {/* ── Floating Widgets (Desktop Wide) ── */}
      <div className="hidden xl:block fixed bottom-6 left-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SyncStatusWidget />
      </div>
      <div className="hidden xl:block fixed bottom-6 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PeriodSelector from="/fleet-status" />
      </div>
    </DashboardLayout>
  );
}
