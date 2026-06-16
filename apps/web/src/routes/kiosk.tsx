import { createFileRoute, redirect } from '@tanstack/react-router';
import { type QueryClient } from '@tanstack/react-query';
import { getOrCreateDeviceId, getKioskToken } from '../utils/auth';
import { type RegisterKioskResponse } from '../hooks/useKioskAuth';
import { customClient } from '../apiClient';
import { msalInstance } from '../utils/msalConfig';

export const Route = createFileRoute('/kiosk')({
  beforeLoad: () => {
    if (getKioskToken()) {
      throw redirect({ to: '/fleet-status' });
    }
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      throw redirect({ to: '/financial' });
    }
  },
  loader: ({ context }) => {
    const queryClient = (context as unknown as { queryClient: QueryClient }).queryClient;
    const deviceId = getOrCreateDeviceId();
    
    queryClient.prefetchQuery({
      queryKey: ['kiosk', 'register', deviceId],
      queryFn: () => customClient<RegisterKioskResponse>({
        url: '/api/kiosk/register',
        method: 'POST',
        data: { deviceId },
      }),
      staleTime: Infinity,
      retry: Infinity,
      retryDelay: 5000,
    });
    return { deviceId };
  },
});
