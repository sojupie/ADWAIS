import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { UserResponseDto } from '@types';
import { toast } from 'sonner';

export function useUsersQuery() {
  return useQuery<UserResponseDto[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch<UserResponseDto[]>('/api/users')
  });
}

export function useCreateUserMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: { email: string; role: string }) => 
      apiFetch<UserResponseDto>('/api/users', {
        method: 'POST',
        body: JSON.stringify(user)
      }),
    onSuccess: () => {
      toast.success('User created successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: Error) => {
      toast.error('Failed to create user', {
        description: err.message || String(err)
      });
    }
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserResponseDto> }) => 
      apiFetch<UserResponseDto>(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('User updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to update user', {
        description: err.message || String(err)
      });
    }
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('User deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      toast.error('Failed to delete user', {
        description: err.message || String(err)
      });
    }
  });
}
