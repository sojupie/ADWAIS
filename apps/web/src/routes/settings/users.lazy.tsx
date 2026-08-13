// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { createLazyFileRoute } from '@tanstack/react-router';
import { UsersView } from '../../pages/Settings/users';
import { RoleBoundary } from '../../components/common/ui/RoleBoundary';

export const Route = createLazyFileRoute('/settings/users')({
  component: () => (
    <RoleBoundary requiredRole="Viewer">
      <UsersView />
    </RoleBoundary>
  ),
});
