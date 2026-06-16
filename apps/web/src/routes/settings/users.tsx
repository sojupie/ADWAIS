import { createFileRoute } from '@tanstack/react-router';
import { UsersView } from "../../pages/Settings/users.tsx";
import { RoleBoundary } from '../../components/common/ui/RoleBoundary';

export const Route = createFileRoute('/settings/users')({
  component: () => (
    <RoleBoundary requiredRole="Admin">
      <UsersView />
    </RoleBoundary>
  ),
});