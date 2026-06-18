import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { GlobalConfigDto, RecurringJobDto, BackgroundJobStatusDto } from '@types';
import { toast } from 'sonner';

export function useGlobalConfigQuery() {
  return useQuery<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>({
    queryKey: ['global-config'],
    queryFn: () => apiFetch<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>('/api/global-config'),
    retry: false
  });
}

export function useRecurringJobsQuery() {
  return useQuery<RecurringJobDto[]>({
    queryKey: ['job-recurring'],
    queryFn: () => apiFetch<RecurringJobDto[]>('/api/job/recurring')
  });
}

export function useRecentJobsQuery() {
  return useQuery<BackgroundJobStatusDto[]>({
    queryKey: ['system-jobs'],
    queryFn: () => apiFetch<BackgroundJobStatusDto[]>('/api/system/health/jobs'),
    refetchInterval: 15000
  });
}

export function useTriggerJobMutation() {
  return useMutation({
    mutationFn: (endpoint: string) => apiFetch(endpoint, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Job triggered successfully.');
    },
    onError: (err: Error) => {
      toast.error('Failed to trigger job', {
        description: err.message || String(err)
      });
    }
  });
}

export function useBackfillMutation(onSuccessCallback?: () => void) {
  return useMutation({
    mutationFn: (payload: { tenantId: string; startDate: string; endDate: string }) => {
      const params = new URLSearchParams();
      params.append('tenantId', payload.tenantId);
      if (payload.startDate) {
        params.append('startDate', new Date(payload.startDate).toISOString());
      }
      if (payload.endDate) {
        params.append('endDate', new Date(payload.endDate).toISOString());
      }
      return apiFetch(`/api/Ingestion/backfill?${params.toString()}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast.success('Backfill initiated.');
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: Error) => {
      toast.error('Backfill failed', {
        description: err.message || String(err)
      });
    }
  });
}

export function useUpdateConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number | null; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>) => 
      apiFetch('/api/global-config', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Configuration updated.');
      queryClient.invalidateQueries({ queryKey: ['global-config'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to update configuration', {
        description: err.message || String(err)
      });
    }
  });
}

export interface FetchIntervalsDto {
  latencyFetchIntervalMinutes: number;
  uptimeFetchIntervalMinutes: number;
  statusFetchIntervalMinutes: number;
  litiumFetchIntervalMinutes: number;
  userStatsFetchIntervalMinutes: number;
}

export function useFetchIntervalsQuery() {
  return useQuery<FetchIntervalsDto>({
    queryKey: ['fetch-intervals'],
    queryFn: () => apiFetch<FetchIntervalsDto>('/api/job/metrics/fetch-intervals'),
  });
}

export function useUpdateFetchIntervalsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<FetchIntervalsDto>) => 
      apiFetch('/api/job/update/intervals', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Fetch intervals updated.');
      queryClient.invalidateQueries({ queryKey: ['fetch-intervals'] });
      queryClient.invalidateQueries({ queryKey: ['job-recurring'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to update intervals', {
        description: err.message || String(err)
      });
    }
  });
}
