import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { UptimeMonitorDto, MonitorAnalyticsDto, ComparisonPeriod } from '@types';
import {buildUrl} from "./useBuildUrl.ts";

export const fleetKeys = {
  all: ['fleet'] as const,
  monitors: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...fleetKeys.all, 'monitors', timeframe, tenantId, comparison] as const,
  analytics: (timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod) => 
    [...fleetKeys.all, 'analytics', timeframe, tenantId, monitorId, comparison] as const,
};

const REFETCH_INTERVAL = 30000;

export function useFleetMonitors(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: fleetKeys.monitors(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<UptimeMonitorDto[]>(buildUrl('/api/monitors', { timeframe, tenantId, comparison })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useFleetAnalytics(timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: fleetKeys.analytics(timeframe, tenantId, monitorId, comparison),
    queryFn: () => apiFetch<MonitorAnalyticsDto>(buildUrl('/api/monitors/analytics', { timeframe, tenantId, monitorId, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}
