import { useSearch } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { CollectionPanel } from '../components/common/CollectionPanel';
import { FactPanel } from '../components/common/FactPanel';
import { LoadingIcon } from '../components/common/LoadingIcon';
import { FleetMatrix } from '../components/FleetStatus/FleetMatrix';
import { NetworkLatencyChart } from '../components/FleetStatus/NetworkLatencyChart';
import { SlaBreachWatchlist } from '../components/FleetStatus/SlaBreachWatchlist';
import { useFleetMonitors, useFleetAnalytics } from '../hooks/useFleetQueries';
import type { UptimeMonitorDto } from '@types';

function normalizeStatus(status?: string | number): string {
  const s = status?.toString() ?? 'Unknown';
  if (s === '2') return 'UP';
  if (s === '8' || s === '9') return 'DOWN';
  return s.toUpperCase().trim();
}

export function FleetStatus() {
  const { timeframe } = useSearch({ from: '/fleet-status' });
  const [selection, setSelection] = useState<{ tenantId: string, monitorId: number | null } | null>(null);

  const analyticsQuery = useFleetAnalytics(timeframe, selection?.tenantId, selection?.monitorId);
  const globalMonitorsQuery = useFleetMonitors(timeframe);

  const allMonitorsInSystem = globalMonitorsQuery.data ?? [];
  const tenantMonitors = selection ? allMonitorsInSystem.filter(m => m.tenantId === selection.tenantId) : allMonitorsInSystem;
  
  const fleetStats = useMemo(() => {
    let list = tenantMonitors;
    if (selection?.monitorId) {
      list = tenantMonitors.filter(m => m.id === selection.monitorId);
    }
    const enabled = list.filter(m => m.uptimeMonitorEnabled);
    
    const latencies = enabled.map(m => m.currentLatency).filter((l): l is number => l !== null && l !== undefined);
    const highestLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    const lowestLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    const down = enabled.filter(m => {
      const s = normalizeStatus(m.currentStatus);
      return s === 'DOWN' || s === 'CRITICAL';
    });

    const degraded = enabled.filter(m => {
      const s = normalizeStatus(m.currentStatus);
      const isUp = s === 'UP' || s === 'OPERATIONAL' || s === 'UNKNOWN' || s === 'PAUSED';
      return isUp && m.currentLatency && m.latencyDegradedFloor && m.currentLatency > m.latencyDegradedFloor;
    });

    const avgUptime = enabled.length > 0 
      ? enabled.reduce((acc, m) => acc + m.currentUptimePercentage, 0) / enabled.length 
      : 0;

    return { total: list.length, enabled, highestLatency, lowestLatency, avgLatency, down, degraded, avgUptime };
  }, [selection, tenantMonitors, allMonitorsInSystem]);

  const handleMonitorSelect = (monitor: UptimeMonitorDto) => {
    if (!selection) {
      setSelection({ tenantId: monitor.tenantId, monitorId: null });
    } else {
      if (monitor.id === selection.monitorId) {
        setSelection({ ...selection, monitorId: null });
      } else {
        setSelection({ ...selection, monitorId: monitor.id });
      }
    }
  };

  const selectedMonitorName = selection?.monitorId 
    ? tenantMonitors.find(m => m.id === selection.monitorId)?.name 
    : null;

  const selectedTenantName = selection?.tenantId 
    ? (tenantMonitors.find(m => m.tenantId === selection.tenantId)?.tenantName || tenantMonitors.find(m => m.tenantId === selection.tenantId)?.name?.split('-')[0]?.trim() || "Tenant")
    : null;

  const activeScopeName = selection?.monitorId
    ? `${selectedTenantName} - ${selectedMonitorName}`
    : selection?.tenantId
    ? `${selectedTenantName} (Tenant Avg)`
    : 'Global (Fleet Avg)';

  return (
    <div className="flex flex-col gap-4 w-full min-h-full">
      {/* Top Row: Macro Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-shrink-0">
        <FactPanel
          label={`Uptime: ${activeScopeName}`}
          value={globalMonitorsQuery.isLoading ? '...' : `${fleetStats.avgUptime.toFixed(3)}%`}
          isLoading={globalMonitorsQuery.isLoading}
        />
        
        <FactPanel
          label={`Latency: ${activeScopeName}`}
          value={analyticsQuery.isLoading ? '...' : `${Math.round(fleetStats.avgLatency)}ms`}
          isLoading={analyticsQuery.isLoading}
        />

        <FactPanel
          label={`Highest Latency`}
          value={analyticsQuery.isLoading ? '...' : `${Math.round(fleetStats.highestLatency)}ms`}
          isLoading={analyticsQuery.isLoading}
          valueColor="red"
        />

        <FactPanel
          label={`Lowest Latency`}
          value={analyticsQuery.isLoading ? '...' : `${Math.round(fleetStats.lowestLatency)}ms`}
          isLoading={analyticsQuery.isLoading}
          valueColor="green"
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-center min-h-[90px]">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Incidents</h2>
          <div className="flex items-baseline gap-6">
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-extrabold tracking-tight text-red-500">{fleetStats.down.length}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOWN</span>
            </div>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-extrabold tracking-tight text-amber-500">{fleetStats.degraded.length}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEGRADED</span>
            </div>
          </div>
        </div>

      </section>

      {/* Middle Row: Main Diagnostics (Flexible Height) */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[350px]">
        <div className="lg:col-span-3 flex flex-col min-h-0 h-full">
            {analyticsQuery.isLoading ? <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-center h-full"><LoadingIcon /></div> :
             analyticsQuery.data ? (
               <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col min-h-0">
                 <NetworkLatencyChart 
                    points={analyticsQuery.data.latencyPoints} 
                    title={`Latency: ${activeScopeName}`}
                    className="min-h-[250px]"
                 />
               </div>
             ) : (
               <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-widest h-full">No telemetry data available</div>
             )}
        </div>
        
        <div className="lg:col-span-2 flex flex-col min-h-0 h-full">
           <SlaBreachWatchlist monitors={allMonitorsInSystem} />
        </div>
      </section>

      {/* Bottom Row: Matrix (Expanded real estate) */}
      <CollectionPanel
        title={selection ? `${selectedTenantName} Monitors` : "Fleet Status Matrix"}
        className="flex-[2] min-h-[300px] flex-shrink-0"
        actions={
          <div className="flex items-center gap-6">
            {selection && (
              <button 
                onClick={() => setSelection(null)}
                className="bg-white border border-[#e5e7eb] px-3 py-1.5 rounded-[4px] text-[11px] font-extrabold text-brand-primary hover:bg-[#f9fafa] uppercase tracking-widest transition-all shadow-sm"
              >
                &larr; Back to Global
              </button>
            )}
            <span className="text-[13px] font-bold text-[#64748b]">
              {fleetStats.enabled.length} Online
            </span>
          </div>
        }
      >
        <div className="px-4 py-3 h-full flex flex-col min-h-0">
          {globalMonitorsQuery.isLoading && selection ? <div className="flex flex-1 items-center justify-center py-4"><LoadingIcon /></div> :
           tenantMonitors.length === 0 && selection ? (
            <div className="flex flex-1 items-center justify-center py-4 text-[#94a3b8] font-bold uppercase tracking-wider text-xs">No monitors found for this tenant</div>
          ) : (
            <FleetMatrix 
              monitors={tenantMonitors} 
              onMonitorSelect={handleMonitorSelect}
              selectedMonitorId={selection?.monitorId}
            />
          )}
        </div>
      </CollectionPanel>
    </div>
  );
}
