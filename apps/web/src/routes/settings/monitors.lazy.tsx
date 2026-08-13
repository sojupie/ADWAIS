// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { createLazyFileRoute } from '@tanstack/react-router';
import { MonitorsView } from '../../pages/Settings/monitors';

export const Route = createLazyFileRoute('/settings/monitors')({
  component: MonitorsView,
});
