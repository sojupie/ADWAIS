import { keepPreviousData } from '@tanstack/react-query';
import { useGetApiMonitors, useGetApiMonitorsAnalytics } from '../api/generated/endpoints';
import type { UptimeMonitorDto, MonitorAnalyticsDto, ComparisonPeriod, Timeframe, ComparisonType } from '@types';

export const fleetKeys = {
  all: ['fleet'] as const,
  monitors: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...fleetKeys.all, 'monitors', timeframe, tenantId, comparison] as const,
  analytics: (timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod) => 
    [...fleetKeys.all, 'analytics', timeframe, tenantId, monitorId, comparison] as const,
};

const REFETCH_INTERVAL = 30000;

export function useFleetMonitors(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useGetApiMonitors<UptimeMonitorDto[], Error>(
    {
      timeframe: timeframe as Timeframe,
      tenantId: tenantId || undefined,
      comparison: comparison as ComparisonType
    },
    {
      query: {
        queryKey: fleetKeys.monitors(timeframe, tenantId, comparison),
        refetchInterval: REFETCH_INTERVAL,
        select: (res) => res.data as UptimeMonitorDto[]
      }
    }
  );
}

export function useFleetAnalytics(timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod) {
  return useGetApiMonitorsAnalytics<MonitorAnalyticsDto, Error>(
    {
      timeframe: timeframe as Timeframe,
      tenantId: tenantId || undefined,
      monitorId: monitorId || undefined,
      comparison: comparison as ComparisonType
    },
    {
      query: {
        queryKey: fleetKeys.analytics(timeframe, tenantId, monitorId, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as MonitorAnalyticsDto
      }
    }
  );
}
