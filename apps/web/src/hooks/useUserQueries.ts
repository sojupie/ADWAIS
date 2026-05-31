import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { UserResponseDto } from '@types';

export function useUsersQuery() {
  return useQuery<UserResponseDto[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch<UserResponseDto[]>('/api/users')
  });
}

export function useCreateUserMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: { name: string; role: string }) => 
      apiFetch<UserResponseDto>('/api/users', {
        method: 'POST',
        body: JSON.stringify(user)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (onSuccessCallback) onSuccessCallback();
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
