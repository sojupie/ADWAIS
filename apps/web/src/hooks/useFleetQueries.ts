import { keepPreviousData } from '@tanstack/react-query';
import { useGetApiMonitors, useGetApiMonitorsAnalytics, useGetApiMonitorsAvailability } from '../api/generated/endpoints';
import type { UptimeMonitorDto, MonitorAnalyticsDto, MonitorAvailabilitySeriesResponseDto, ComparisonPeriod, Timeframe, ComparisonType } from '@types';

export const fleetKeys = {
  all: ['fleet'] as const,
  monitors: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...fleetKeys.all, 'monitors', timeframe, tenantId, comparison] as const,
  analytics: (timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod, tags?: string[], statuses?: string[]) => 
    [...fleetKeys.all, 'analytics', timeframe, tenantId, monitorId, comparison, tags, statuses] as const,
  availability: (timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod, tags?: string[], statuses?: string[]) =>
    [...fleetKeys.all, 'availability', timeframe, tenantId, monitorId, comparison, tags, statuses] as const,
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

export function useFleetAnalytics(timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod, tags?: string[], statuses?: string[]) {
  return useGetApiMonitorsAnalytics<MonitorAnalyticsDto, Error>(
    {
      timeframe: timeframe as Timeframe,
      tenantId: tenantId || undefined,
      monitorId: monitorId || undefined,
      comparison: comparison as ComparisonType,
      tags: tags,
      statuses: statuses
    },
    {
      query: {
        queryKey: fleetKeys.analytics(timeframe, tenantId, monitorId, comparison, tags, statuses),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as MonitorAnalyticsDto
      }
    }
  );
}

export function useFleetAvailability(timeframe: string, tenantId?: string | null, monitorId?: number | null, comparison?: ComparisonPeriod, tags?: string[], statuses?: string[]) {
  return useGetApiMonitorsAvailability<MonitorAvailabilitySeriesResponseDto, Error>(
    {
      timeframe: timeframe as Timeframe,
      tenantId: tenantId || undefined,
      monitorId: monitorId ?? undefined,
      comparison: comparison as ComparisonType,
      tags,
      statuses,
    },
    {
      query: {
        queryKey: fleetKeys.availability(timeframe, tenantId, monitorId, comparison, tags, statuses),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: response => response.data,
      },
    },
  );
}
