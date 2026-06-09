import { ArrowLeft } from 'lucide-react';
import { CollectionPanel } from '../components/common/dashboard/CollectionPanel';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { FleetMatrix } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart } from '../components/FleetStatus/NetworkLatencyChart';
import { SlaBreachWatchlist } from '../components/FleetStatus/SlaBreachWatchlist';
import {DashboardLayout} from "../components/common/layout/DashboardLayout.tsx";
import {DashboardTopRow} from "../components/common/layout/DashboardTopRow.tsx";
import {DashboardFlexRow} from "../components/common/layout/DashboardFlexRow.tsx";
import {useFleetStatusViewModel} from "../hooks/useFleetStatusViewModel.ts";

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

  const matrixContent = vm.tenantMonitors.length === 0 && vm.selection ? (
    <div className="flex flex-1 items-center justify-center py-4 text-slate-500 font-bold uppercase tracking-wider text-xs">
      No monitors found for this tenant
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

      {/* Middle Row: Main Diagnostics (Flexible Height) */}
      <DashboardFlexRow weight={"flex-1"} gridCols={"5"}>
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col min-h-0">
              <NetworkLatencyChart 
                 points={vm.analyticsQuery.data?.latencyPoints || []}
                 title={`Latency: ${vm.activeScopeName}`}
                 isLoading={vm.analyticsQuery.isLoading}
                 className="min-h-[250px]"
              />
            </div>
        </div>

        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
           <SlaBreachWatchlist
             monitors={vm.scopedMonitors}
             onClearSelection={vm.selection ? () => vm.setSelection(null) : undefined}
           />
        </div>
      </DashboardFlexRow>

      {/* Bottom Row: Matrix */}
      <DashboardFlexRow weight="flex-2">
        <CollectionPanel
          title={vm.selection ? `${vm.selectedTenantName} Monitors` : "Fleet Status Matrix"}
          className="h-full min-h-75"
          isLoading={vm.globalMonitorsQuery.isLoading && vm.selection !== null}
          actions={matrixActions}
        >
          <div className="px-4 py-3 h-full flex flex-col min-h-0">
            {matrixContent}
          </div>
        </CollectionPanel>
      </DashboardFlexRow>
    </DashboardLayout>
  );
}
