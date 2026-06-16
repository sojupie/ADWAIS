import { createFileRoute, redirect } from '@tanstack/react-router';
import { getKioskToken } from '../utils/auth';
import { msalInstance } from '../utils/msalConfig';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (getKioskToken()) {
      throw redirect({ to: '/fleet-status' });
    }
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      throw redirect({ to: '/financial' });
    }
  },
});
