import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { 
  GlobalKpi, 
  GrowthExtreme, 
  FinancialVelocityPoint, 
  MomentumResponse,
  RevenueEfficiencyResponse,
  VolumeAnomalyResponseDto,
  CumulativeGrowthDeltaPoint,
  OrderBin,
  AccumulatedRevenuePointDto,
  TransactionDensityPointDto
} from '@types';
import {buildUrl} from "./useBuildUrl.ts";

export const financialKeys = {
  all: ['financial'] as const,
  kpis: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'kpis', timeframe, tenantId] as const,
  velocity: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'velocity', timeframe, tenantId] as const,
  extremes: (timeframe: string) => [...financialKeys.all, 'extremes', timeframe] as const,
  momentum: (timeframe: string) => [...financialKeys.all, 'momentum', timeframe] as const,
  revenueEfficiency: (timeframe: string) => [...financialKeys.all, 'revenueEfficiency', timeframe] as const,
  volumeAnomaly: (timeframe: string) => [...financialKeys.all, 'volumeAnomaly', timeframe] as const,
  delta: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'delta', timeframe, tenantId] as const,
  orders: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'orders', timeframe, tenantId] as const,
  accumulatedRevenue: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'accumulatedRevenue', timeframe, tenantId] as const,
  transactionDensity: (timeframe: string, tenantId?: string | null) => [...financialKeys.all, 'transactionDensity', timeframe, tenantId] as const,
};

const REFETCH_INTERVAL = 60000;

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

export function useAccumulatedRevenue(timeframe: string, tenantId?: string) {
  return useQuery({
    queryKey: financialKeys.accumulatedRevenue(timeframe, tenantId),
    queryFn: () => apiFetch<AccumulatedRevenuePointDto[]>(buildUrl('/api/financial/accumulated-revenue', { timeframe, tenantId })),
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

export function useRevenueEfficiency(timeframe: string) {
  return useQuery({
    queryKey: financialKeys.revenueEfficiency(timeframe),
    queryFn: () => apiFetch<RevenueEfficiencyResponse>(buildUrl('/api/financial/revenue-efficiency', { timeframe })),
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useVolumeAnomaly(timeframe: string) {
  return useQuery({
    queryKey: financialKeys.volumeAnomaly(timeframe),
    queryFn: () => apiFetch<VolumeAnomalyResponseDto[]>(buildUrl('/api/financial/volume-anomaly', { timeframe })),
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

export function useTransactionDensity(timeframe: string, tenantId?: string | null) {
  return useQuery({
    queryKey: financialKeys.transactionDensity(timeframe, tenantId),
    queryFn: () => apiFetch<TransactionDensityPointDto[]>(buildUrl('/api/financial/transaction-density', { timeframe, tenantId })),
    refetchInterval: REFETCH_INTERVAL,
  });
}
