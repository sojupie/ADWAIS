// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import type { ProviderDescriptor } from '@types';
import {
  useGetApiIntegrationsMonitoringProviders,
  useGetApiIntegrationsOrderProviders,
} from '../api/generated/endpoints';

export function useOrderProviderDescriptorsQuery() {
  return useGetApiIntegrationsOrderProviders<ProviderDescriptor[], Error>({
    query: { select: response => response.data },
  });
}

export function useMonitoringProviderDescriptorsQuery() {
  return useGetApiIntegrationsMonitoringProviders<ProviderDescriptor[], Error>({
    query: { select: response => response.data },
  });
}
