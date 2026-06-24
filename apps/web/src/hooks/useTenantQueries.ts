import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetApiTenants, 
  usePostApiTenants, 
  useDeleteApiTenantsId, 
  usePatchApiTenantsId 
} from '../api/generated/endpoints';
import type { TenantResponseDto } from '@types';
import { toast } from 'sonner';

export function useTenantsQuery() {
  return useGetApiTenants<TenantResponseDto[], Error>(undefined, {
    query: {
      queryKey: ['tenants'],
      select: (res) => res.data as TenantResponseDto[]
    }
  });
}

export function useCreateTenantMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const mutation = usePostApiTenants<Error>({
    mutation: {
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
    }
  });

  return {
    ...mutation,
    mutate: (
      payload: { name: string; litiumBaseUrl: string; serviceAccountToken: string },
      options?: Parameters<typeof mutation.mutate>[1]
    ) => 
      mutation.mutate({ 
        data: { ...payload, type: 'B2B', orderFetchingEnabled: false } 
      }, options)
  };
}

export function useDeleteTenantMutation() {
  const queryClient = useQueryClient();
  const mutation = useDeleteApiTenantsId<Error>({
    mutation: {
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
    }
  });

  return {
    ...mutation,
    mutate: (id: string, options?: Parameters<typeof mutation.mutate>[1]) => 
      mutation.mutate({ id }, options)
  };
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient();
  const mutation = usePatchApiTenantsId<Error>({
    mutation: {
      onSuccess: (res) => {
        toast.success('Tenant updated successfully.');
        const data = (res as unknown as { data: TenantResponseDto }).data;
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
    }
  });

  return {
    ...mutation,
    mutate: (
      variables: { id: string; payload: Partial<TenantResponseDto> & { serviceAccountToken?: string } },
      options?: Parameters<typeof mutation.mutate>[1]
    ) => 
      mutation.mutate({ id: variables.id, data: variables.payload }, options)
  };
}
