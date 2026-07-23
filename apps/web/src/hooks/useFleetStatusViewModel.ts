import { useFleetAnalytics, useFleetAvailability, useFleetMonitors } from "./useFleetQueries.ts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeStatus } from "../utils/monitorStatusHelper.ts";
import type { UptimeMonitorDto } from "@types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Timeframe } from "../schemas";
import { filterFleetMonitors, getFleetTags, isFleetSelectionVisible, type FleetSelection } from "../utils/fleetFilters.ts";

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

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(currentValue =>
      value instanceof Function ? value(currentValue) : value,
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

export function useFleetStatusViewModel() {
    // Reactively subscribe to the URL state. 
    // The route's beforeLoad guarantees this will be populated.
    const search = useSearch({ from: '/fleet-status' }) as {
        timeframe: Timeframe;
        tenantId?: string;
        monitorId?: number;
    };
    const navigate = useNavigate({ from: '/fleet-status' });
    const timeframe = search.timeframe;
    const selectionIntent: FleetSelection | null = search.tenantId
        ? { tenantId: search.tenantId, monitorId: search.monitorId ?? null }
        : null;
    const setSelection = useCallback((nextSelection: FleetSelection | null) => {
        void navigate({
            search: previous => ({
                ...previous,
                tenantId: nextSelection?.tenantId,
                monitorId: nextSelection?.monitorId ?? undefined,
            }),
        });
    }, [navigate]);

    const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('fleet-filter-tags', []);
    const [selectedStatuses, setSelectedStatuses] = useLocalStorage<string[]>('fleet-filter-statuses', []);

    // Drill-down navigation is intentionally separate from filter reset. Going back
    // to the fleet scope must not discard the user's persisted tag/status choices.
    const clearSelection = useCallback(() => setSelection(null), [setSelection]);
    const resetFilters = useCallback(() => {
        clearSelection();
        setSelectedTags([]);
        setSelectedStatuses([]);
    }, [clearSelection, setSelectedTags, setSelectedStatuses]);

    const tagsArg = selectedTags.length > 0 ? selectedTags : undefined;
    const statusesArg = selectedStatuses.length > 0 ? selectedStatuses : undefined;

    const globalMonitorsQuery = useFleetMonitors(timeframe);
    const allMonitorsInSystem = useMemo(() => {
        const fetchedMonitors = globalMonitorsQuery.data ?? [];
        if (import.meta.env.PROD) return fetchedMonitors;
        
        return [...fetchedMonitors];
    }, [globalMonitorsQuery.data]);

    const availableTags = useMemo(() => getFleetTags(allMonitorsInSystem), [allMonitorsInSystem]);
    const filteredMonitors = useMemo(
        () => filterFleetMonitors(allMonitorsInSystem, {
            tags: selectedTags,
            statuses: selectedStatuses,
        }),
        [allMonitorsInSystem, selectedStatuses, selectedTags],
    );

    const selection = selectionIntent && (
        globalMonitorsQuery.isLoading || isFleetSelectionVisible(filteredMonitors, selectionIntent)
    )
        ? selectionIntent
        : null;

    const analyticsQuery = useFleetAnalytics(
        timeframe,
        selection?.tenantId,
        selection?.monitorId,
        undefined,
        tagsArg,
        statusesArg,
    );
    const availabilityQuery = useFleetAvailability(
        timeframe,
        selection?.tenantId,
        selection?.monitorId,
        undefined,
        tagsArg,
        statusesArg,
    );

    const updateSelectedTags = useCallback((nextTags: string[]) => {
        const nextMonitors = filterFleetMonitors(allMonitorsInSystem, {
            tags: nextTags,
            statuses: selectedStatuses,
        });
        if (selection && !isFleetSelectionVisible(nextMonitors, selection)) return;
        setSelectedTags(nextTags);
    }, [allMonitorsInSystem, selectedStatuses, selection, setSelectedTags]);

    const updateSelectedStatuses = useCallback((nextStatuses: string[]) => {
        const nextMonitors = filterFleetMonitors(allMonitorsInSystem, {
            tags: selectedTags,
            statuses: nextStatuses,
        });
        if (selection && !isFleetSelectionVisible(nextMonitors, selection)) return;
        setSelectedStatuses(nextStatuses);
    }, [allMonitorsInSystem, selectedTags, selection, setSelectedStatuses]);

    const tenantMonitors = selection ? filteredMonitors.filter(m => m.tenantId === selection.tenantId) : filteredMonitors;
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
            const floor = m.latencyDegradedFloor;
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
            uptimeGrowth: kpis?.uptimeGrowthPercentage ?? null,
            latencyGrowth: kpis?.latencyGrowthPercentage ?? null,
            highestLatencyGrowth: kpis?.highestLatencyGrowthPercentage ?? null,
            lowestLatencyGrowth: kpis?.lowestLatencyGrowthPercentage ?? null
        };
    }, [scopedMonitors, kpis]);

    const handleMonitorSelect = (monitor: UptimeMonitorDto) => {
        if (!selection) {
            const isOnlyMonitorForTenant = allMonitorsInSystem
                .filter(candidate => candidate.tenantId === monitor.tenantId)
                .length === 1;
            setSelection({
                tenantId: monitor.tenantId,
                monitorId: isOnlyMonitorForTenant ? monitor.id : null,
            });
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

    const selectedMonitor = selection?.monitorId
        ? tenantMonitors.find(m => m.id === selection.monitorId) ?? null
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
        clearSelection,
        resetFilters,
        analyticsQuery,
        availabilityQuery,
        globalMonitorsQuery,
        tenantMonitors,
        scopedMonitors,
        fleetStats,
        handleMonitorSelect,
        selectedTenantName,
        selectedMonitor,
        activeScopeName,
        allMonitors: allMonitorsInSystem,
        availableTags,
        filteredMonitors,
        selectedTags,
        setSelectedTags: updateSelectedTags,
        selectedStatuses,
        setSelectedStatuses: updateSelectedStatuses
    }
}
