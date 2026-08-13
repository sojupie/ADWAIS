// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { createLazyFileRoute } from '@tanstack/react-router';
import { FleetStatus } from '../pages/FleetStatus';

export const Route = createLazyFileRoute('/fleet-status')({
  component: FleetStatus,
});
