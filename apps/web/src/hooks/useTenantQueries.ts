import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { TenantResponseDto } from '@types';
import { toast } from 'sonner';

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
      toast.success('Tenant created successfully.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: Error) => {
      toast.error('Failed to create tenant', {
        description: err.message || String(err)
      });
    }
  });
}

export function useDeleteTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Tenant deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to delete tenant', {
        description: err.message || String(err)
      });
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
      toast.success('Tenant updated successfully.');
      queryClient.setQueryData(['tenants'], (old: TenantResponseDto[] | undefined) => {
        if (!old) return old;
        return old.map(t => t.id === data.id ? data : t);
      });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to update tenant', {
        description: err.message || String(err)
      });
    }
  });
}
