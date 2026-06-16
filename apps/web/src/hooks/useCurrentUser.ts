import { useQuery } from '@tanstack/react-query';
import { useMsal } from '@azure/msal-react';
import { getKioskToken } from '../utils/auth';
import { parseJwt } from '../utils/jwt';
import { apiFetch } from '../apiClient';

export interface UserProfile {
  id: string;
  name: string;
  role: 'Admin' | 'Employee' | 'Viewer';
}

export function useCurrentUser() {
  const kioskToken = getKioskToken();
  const { accounts } = useMsal();
  const hasMsalAccount = accounts.length > 0;

  // Derive Kiosk state directly on render (no useEffect)
  const kioskUser = kioskToken ? parseJwt(kioskToken) : null;
  const kioskRole = kioskUser?.role as 'Admin' | 'Employee' | 'Viewer' | undefined;

  // Query Entra ID user profile only when authenticated via MSAL and not in Kiosk mode
  const msalQuery = useQuery<UserProfile>({
    queryKey: ['current-user'],
    queryFn: () => apiFetch<UserProfile>('/api/users/me'),
    enabled: hasMsalAccount && !kioskToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Calculate profile and role dynamically on render
  if (kioskToken) {
    return {
      isLoading: false,
      user: {
        id: kioskUser?.sub || 'kiosk',
        name: kioskUser?.name || 'Kiosk Device',
        role: kioskRole || 'Viewer',
      } as UserProfile,
      role: kioskRole || 'Viewer',
    };
  }

  if (hasMsalAccount) {
    return {
      isLoading: msalQuery.isLoading,
      user: msalQuery.data || null,
      role: msalQuery.data?.role || null,
    };
  }

  return {
    isLoading: false,
    user: null,
    role: null,
  };
}
