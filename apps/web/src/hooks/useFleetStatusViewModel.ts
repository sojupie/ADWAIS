import { useFleetAnalytics, useFleetMonitors } from "./useFleetQueries.ts";
import { useMemo, useState } from "react";
import { normalizeStatus } from "../utils/monitorStatusHelper.ts";
import type { UptimeMonitorDto } from "@types";
import { useSearch } from "@tanstack/react-router";
import type { Timeframe } from "../schemas";
import { useGlobalConfigQuery } from "./useJobSettingsQueries.ts";

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue] as const;
}

export function useFleetStatusViewModel() {
    // Reactively subscribe to the URL state. 
    // The route's beforeLoad guarantees this will be populated.
    const search = useSearch({ strict: false }) as { timeframe: Timeframe };
    const timeframe = search.timeframe;

    const [selection, setSelection] = useState<{ tenantId: string, monitorId: number | null } | null>(null);

    const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('fleet-filter-tags', []);
    const [selectedStatuses, setSelectedStatuses] = useLocalStorage<string[]>('fleet-filter-statuses', []);

    const tagsArg = selectedTags.length > 0 ? selectedTags : undefined;
    const statusesArg = selectedStatuses.length > 0 ? selectedStatuses : undefined;

    const analyticsQuery = useFleetAnalytics(timeframe, selection?.tenantId, selection?.monitorId, undefined, tagsArg, statusesArg);
    const globalMonitorsQuery = useFleetMonitors(timeframe, undefined, undefined, tagsArg, statusesArg);
    const { data: config } = useGlobalConfigQuery();

    const defaultSla = config?.defaultUptimeSla ?? null;
    const defaultDegradedFloor = config?.latencyDegradedFloor ?? null;

    const fetchedMonitors = globalMonitorsQuery.data ?? [];
    
    const allMonitorsInSystem = useMemo(() => {
        if (import.meta.env.PROD) return fetchedMonitors;
        
        const mockMonitors: UptimeMonitorDto[] = [
            {
                id: -9001, tenantId: "mock-1", tenantName: "MOCK: UP", name: "Up Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "UP",
                currentLatency: 120, currentUptimePercentage: 99.99, tags: ["status:up"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.0
            },
            {
                id: -9002, tenantId: "mock-2", tenantName: "MOCK: DOWN", name: "Down Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "DOWN",
                currentLatency: null, currentUptimePercentage: 97.5, tags: ["status:down"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.0, lastSyncError: "Connection timeout"
            },
            {
                id: -9003, tenantId: "mock-3", tenantName: "MOCK: DEGRADED", name: "Degraded Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "UP",
                currentLatency: 850, currentUptimePercentage: 99.99, tags: ["status:degraded"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.0
            },
            {
                id: -9004, tenantId: "mock-4", tenantName: "MOCK: SLA BREACH", name: "Breached Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "UP",
                currentLatency: 150, currentUptimePercentage: 98.2, tags: ["status:sla-breach"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.5
            },
            {
                id: -9005, tenantId: "mock-5", tenantName: "MOCK: PAUSED", name: "Paused Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "PAUSED",
                currentLatency: null, currentUptimePercentage: null, tags: ["status:paused"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.0
            },
            {
                id: -9006, tenantId: "mock-6", tenantName: "MOCK: STARTING", name: "Starting Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "STARTING",
                currentLatency: null, currentUptimePercentage: null, tags: ["status:starting"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.0
            },
            {
                id: -9007, tenantId: "mock-7", tenantName: "MOCK: UNKNOWN", name: "Unknown Storefront",
                url: "https://example.com", uptimeMonitorEnabled: true, currentStatus: "UNKNOWN",
                currentLatency: null, currentUptimePercentage: null, tags: ["status:unknown"],
                updateInterval: 300, latencyDegradedFloor: 500, uptimeSla: 99.0
            }
        ] as UptimeMonitorDto[];

        return [...fetchedMonitors, ...mockMonitors];
    }, [fetchedMonitors]);

    const tenantMonitors = selection ? allMonitorsInSystem.filter(m => m.tenantId === selection.tenantId) : allMonitorsInSystem;
    const scopedMonitors = selection?.monitorId ? tenantMonitors.filter(m => m.id === selection.monitorId) : tenantMonitors;

    const kpis = analyticsQuery.data?.kpis;

    const fleetStats = useMemo(() => {
        const enabled = scopedMonitors.filter(m => m.uptimeMonitorEnabled);

        const down = enabled.filter(m => {
            const s = normalizeStatus(m.currentStatus);
            return s === 'DOWN' || s === 'CRITICAL';
        });

        const degraded = enabled.filter(m => {
            const s = normalizeStatus(m.currentStatus);
            const isUp = s === 'UP' || s === 'PAUSED' || s === 'STARTING' || s === 'UNKNOWN';
            const floor = m.latencyDegradedFloor ?? defaultDegradedFloor;
            return isUp && m.currentLatency !== null && m.currentLatency !== undefined && floor !== null && floor !== undefined && m.currentLatency > floor;
        });

        const avgUptime = kpis?.averageUptime !== undefined ? kpis.averageUptime : null;
        const avgLatency = kpis?.averageLatency ?? 0;
        const highestLatency = kpis?.highestLatency ?? 0;
        const lowestLatency = kpis?.lowestLatency ?? 0;

        return { 
            total: scopedMonitors.length, 
            enabled, 
            highestLatency, 
            lowestLatency, 
            avgLatency, 
            down, 
            degraded, 
            avgUptime,
            uptimeGrowth: kpis?.uptimeGrowthPercentage ?? 0,
            latencyGrowth: kpis?.latencyGrowthPercentage ?? 0,
            highestLatencyGrowth: kpis?.highestLatencyGrowthPercentage ?? 0,
            lowestLatencyGrowth: kpis?.lowestLatencyGrowthPercentage ?? 0
        };
    }, [scopedMonitors, defaultDegradedFloor, kpis]);

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

    return {
        selection,
        setSelection,
        analyticsQuery,
        globalMonitorsQuery,
        tenantMonitors,
        scopedMonitors,
        fleetStats,
        handleMonitorSelect,
        selectedTenantName,
        activeScopeName,
        defaultSla,
        defaultDegradedFloor,
        selectedTags,
        setSelectedTags,
        selectedStatuses,
        setSelectedStatuses
    }
}