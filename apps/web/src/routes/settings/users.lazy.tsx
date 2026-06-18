import { createLazyFileRoute } from '@tanstack/react-router';
import { UsersView } from '../../pages/Settings/users';
import { RoleBoundary } from '../../components/common/ui/RoleBoundary';

export const Route = createLazyFileRoute('/settings/users')({
  component: () => (
    <RoleBoundary requiredRole="Admin">
      <UsersView />
    </RoleBoundary>
  ),
});
