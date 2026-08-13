// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { createLazyFileRoute } from '@tanstack/react-router'
import { ConfigurationView } from '../../pages/Settings/configuration'

export const Route = createLazyFileRoute('/settings/configuration')({
  component: ConfigurationView,
})
