import { createLazyFileRoute } from '@tanstack/react-router';
import { TenantDetailView } from '../../pages/Settings/TenantDetail';

export const Route = createLazyFileRoute('/settings/tenants_/$tenantId')({
  component: TenantDetailView,
});
