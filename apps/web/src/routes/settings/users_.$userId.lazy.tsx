// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
