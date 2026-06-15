import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { TenantResponseDto } from '@types';

export function useTenantsQuery() {
  return useQuery<TenantResponseDto[]>({
    queryKey: ['tenants'],
    queryFn: () => apiFetch<TenantResponseDto[]>('/api/tenants')
  });
}

export function useCreateTenantMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; litiumBaseUrl: string; serviceAccountToken: string }) => 
      apiFetch<TenantResponseDto>('/api/tenants', { 
        method: 'POST', 
        body: JSON.stringify({ ...payload, type: 'B2B', orderFetchingEnabled: false }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      if (onSuccessCallback) onSuccessCallback();
    }
  });
}

export function useDeleteTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
    }
  });
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TenantResponseDto> & { serviceAccountToken?: string } }) => 
      apiFetch<TenantResponseDto>(`/api/tenants/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(payload) 
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['tenants'], (old: TenantResponseDto[] | undefined) => {
        if (!old) return old;
        return old.map(t => t.id === data.id ? data : t);
      });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
}
