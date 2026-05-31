import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { GlobalConfigDto, RecurringJobDto } from '@types';

export function useGlobalConfigQuery() {
  return useQuery<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>({
    queryKey: ['global-config'],
    queryFn: () => apiFetch<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>('/api/global-config')
  });
}

export function useRecurringJobsQuery() {
  return useQuery<RecurringJobDto[]>({
    queryKey: ['job-recurring'],
    queryFn: () => apiFetch<RecurringJobDto[]>('/api/job/recurring')
  });
}

export function useTriggerJobMutation() {
  return useMutation({
    mutationFn: (endpoint: string) => apiFetch(endpoint, { method: 'POST' }),
    onSuccess: () => alert('Job triggered successfully.')
  });
}

export function useBackfillMutation(onSuccessCallback?: () => void) {
  return useMutation({
    mutationFn: (payload: { tenantId: string; startDate: string; endDate: string }) => 
      apiFetch('/api/Ingestion/backfill', {
        method: 'POST',
        body: JSON.stringify({ 
          tenantId: payload.tenantId, 
          startDate: payload.startDate ? new Date(payload.startDate).toISOString() : null, 
          endDate: payload.endDate ? new Date(payload.endDate).toISOString() : null 
        })
      }),
    onSuccess: () => {
      alert('Backfill initiated.');
      if (onSuccessCallback) onSuccessCallback();
    }
  });
}

export function useUpdateConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>) => 
      apiFetch('/api/global-config', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-config'] });
    }
  });
}
