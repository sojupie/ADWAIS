import { createLazyFileRoute } from '@tanstack/react-router';
import { UserDetailView } from '../../pages/Settings/UserDetail';
import { RoleBoundary } from '../../components/common/ui/RoleBoundary';

export const Route = createLazyFileRoute('/settings/users_/$userId')({
  component: () => (
    <RoleBoundary requiredRole="Viewer">
      <UserDetailView />
    </RoleBoundary>
  ),
});
