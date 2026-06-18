import { createLazyFileRoute } from '@tanstack/react-router';
import { AuthenticationSettings } from '../../pages/Settings/authentication';

export const Route = createLazyFileRoute('/settings/authentication')({
  component: AuthenticationSettings,
});
