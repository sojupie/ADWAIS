import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { UptimeMonitorDto, MonitorAnalyticsDto } from '@types';
import {buildUrl} from "./useBuildUrl.ts";

export const fleetKeys = {
  all: ['fleet'] as const,
  monitors: (timeframe: string, tenantId?: string | null) => [...fleetKeys.all, 'monitors', timeframe, tenantId] as const,
  analytics: (timeframe: string, tenantId?: string | null, monitorId?: number | null) => 
    [...fleetKeys.all, 'analytics', timeframe, tenantId, monitorId] as const,
};

const REFETCH_INTERVAL = 30000;

export function useFleetMonitors(timeframe: string, tenantId?: string | null) {
  return useQuery({
    queryKey: fleetKeys.monitors(timeframe, tenantId),
    queryFn: () => apiFetch<UptimeMonitorDto[]>(buildUrl('/api/monitors', { timeframe, tenantId })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useFleetAnalytics(timeframe: string, tenantId?: string | null, monitorId?: number | null) {
  return useQuery({
    queryKey: fleetKeys.analytics(timeframe, tenantId, monitorId),
    queryFn: () => apiFetch<MonitorAnalyticsDto>(buildUrl('/api/monitors/analytics', { timeframe, tenantId, monitorId })),
    refetchInterval: REFETCH_INTERVAL,
  });
}
