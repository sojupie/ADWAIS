import { createLazyFileRoute } from '@tanstack/react-router';
import { TenantsMonitorsView } from '../../pages/Settings/tenants';

export const Route = createLazyFileRoute('/settings/tenants')({
  component: TenantsMonitorsView,
});
