import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { UptimeMonitorDto, ComparisonPeriod, UpdateMonitorRequestDto } from '@types';
import { buildUrl } from './useBuildUrl.ts';
import { toast } from 'sonner';

export function useMonitorsQuery(timeframe?: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useQuery<UptimeMonitorDto[]>({
    queryKey: ['monitors', timeframe, tenantId, comparison],
    queryFn: () => apiFetch<UptimeMonitorDto[]>(buildUrl('/api/monitors', { timeframe, tenantId, comparison }))
  });
}

export function useUnassignedMonitorsQuery(timeframe?: string, comparison?: ComparisonPeriod) {
  return useQuery<UptimeMonitorDto[]>({
    queryKey: ['unassigned-monitors', timeframe, comparison],
    queryFn: () => apiFetch<UptimeMonitorDto[]>(buildUrl('/api/monitors/unassigned', { timeframe, comparison }))
  });
}

export function useCreateMonitorMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; url: string; uptimeSla: number | null }) => 
      apiFetch<UptimeMonitorDto>('/api/monitors?tenantId=00000000-0000-0000-0000-000000000001', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      }),
    onSuccess: () => {
      toast.success('Monitor created successfully.');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: Error) => {
      toast.error('Failed to create monitor', {
        description: err.message || String(err)
      });
    }
  });
}

export function useControlMonitorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'start' | 'pause' }) => 
      apiFetch(`/api/monitors/${id}/${action}`, { method: 'POST' }),
    onSuccess: (_, variables) => {
      toast.success(`Monitor ${variables.action === 'start' ? 'started' : 'paused'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to control monitor', {
        description: err.message || String(err)
      });
    }
  });
}

export function useUpdateMonitorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMonitorRequestDto }) => 
      apiFetch<UptimeMonitorDto>(`/api/monitors/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(payload) 
      }),
    onSuccess: () => {
      toast.success('Monitor updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to update monitor', {
        description: err.message || String(err)
      });
    }
  });
}

export function useAssignMonitorMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tenantId }: { id: number; tenantId: string }) => 
      apiFetch(`/api/monitors/${id}/assign/${tenantId}`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success('Monitor assigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: Error) => {
      toast.error('Failed to assign monitor', {
        description: err.message || String(err)
      });
    }
  });
}

export function useUnassignMonitorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/monitors/${id}/unassign`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success('Monitor unassigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to unassign monitor', {
        description: err.message || String(err)
      });
    }
  });
}
