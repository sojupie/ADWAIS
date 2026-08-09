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
