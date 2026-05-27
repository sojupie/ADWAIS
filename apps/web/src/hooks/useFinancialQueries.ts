import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { 
  GlobalKpi, 
  GrowthExtreme, 
  FinancialVelocityPoint, 
  MomentumResponse, 
  DistributionEntry,
  CumulativeGrowthDeltaPoint,
  OrderBin
} from '@types';

export const financialKeys = {
  all: ['financial'] as const,
  kpis: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'kpis', timeframe, tenantId] as const,
  velocity: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'velocity', timeframe, tenantId] as const,
  extremes: (timeframe: string) => [...financialKeys.all, 'extremes', timeframe] as const,
  momentum: (timeframe: string) => [...financialKeys.all, 'momentum', timeframe] as const,
  distribution: (timeframe: string) => [...financialKeys.all, 'distribution', timeframe] as const,
  delta: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'delta', timeframe, tenantId] as const,
  orders: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'orders', timeframe, tenantId] as const,
};

const REFETCH_INTERVAL = 60000;

function buildUrl(base: string, params: Record<string, string | number | null | undefined>) {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });
  return url.pathname + url.search;
}

export function useGlobalKpis(timeframe: string, tenantId?: string | null) {
  return useQuery({
    queryKey: financialKeys.kpis(timeframe, tenantId),
    queryFn: () => apiFetch<GlobalKpi>(buildUrl('/api/financial/kpis', { timeframe, tenantId })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useFinancialVelocity(timeframe: string, tenantId?: string | null) {
  return useQuery({
    queryKey: financialKeys.velocity(timeframe, tenantId),
    queryFn: () => apiFetch<FinancialVelocityPoint[]>(buildUrl('/api/financial/velocity', { timeframe, tenantId })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useGrowthExtremes(timeframe: string) {
  return useQuery({
    queryKey: financialKeys.extremes(timeframe),
    queryFn: () => apiFetch<GrowthExtreme[]>(buildUrl('/api/financial/growth-extremes', { timeframe })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useMomentum(timeframe: string) {
  return useQuery({
    queryKey: financialKeys.momentum(timeframe),
    queryFn: () => apiFetch<MomentumResponse>(buildUrl('/api/financial/momentum', { timeframe })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useRevenueDistribution(timeframe: string) {
  return useQuery({
    queryKey: financialKeys.distribution(timeframe),
    queryFn: () => apiFetch<DistributionEntry[]>(buildUrl('/api/financial/distribution', { timeframe, topN: 10 })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useCumulativeGrowthDelta(timeframe: string, tenantId: string) {
  return useQuery({
    queryKey: financialKeys.delta(timeframe, tenantId),
    queryFn: () => apiFetch<CumulativeGrowthDeltaPoint[]>(buildUrl('/api/financial/cumulative-growth-delta', { timeframe, tenantId })),
    enabled: !!tenantId,
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useOrderDistribution(timeframe: string, tenantId: string) {
  return useQuery({
    queryKey: financialKeys.orders(timeframe, tenantId),
    queryFn: () => apiFetch<OrderBin[]>(buildUrl('/api/financial/order-distribution', { timeframe, tenantId })),
    enabled: !!tenantId,
    refetchInterval: REFETCH_INTERVAL,
  });
}
