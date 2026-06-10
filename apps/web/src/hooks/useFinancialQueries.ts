import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '../apiClient';
import type { 
  ComparisonPeriod,
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
  kpis: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'kpis', timeframe, tenantId, comparison] as const,
  velocity: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'velocity', timeframe, tenantId, comparison] as const,
  extremes: (timeframe: string, comparison?: ComparisonPeriod) => [...financialKeys.all, 'extremes', timeframe, comparison] as const,
  momentum: (timeframe: string, comparison?: ComparisonPeriod) => [...financialKeys.all, 'momentum', timeframe, comparison] as const,
  revenueEfficiency: (timeframe: string, comparison?: ComparisonPeriod) => [...financialKeys.all, 'revenueEfficiency', timeframe, comparison] as const,
  volumeAnomaly: (timeframe: string, comparison?: ComparisonPeriod) => [...financialKeys.all, 'volumeAnomaly', timeframe, comparison] as const,
  delta: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'delta', timeframe, tenantId, comparison] as const,
  orders: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'orders', timeframe, tenantId, comparison] as const,
  accumulatedRevenue: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'accumulatedRevenue', timeframe, tenantId, comparison] as const,
  transactionDensity: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'transactionDensity', timeframe, tenantId, comparison] as const,
};

const REFETCH_INTERVAL = 60000;

export function useGlobalKpis(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.kpis(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<GlobalKpi>(buildUrl('/api/financial/kpis', { timeframe, tenantId, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useFinancialVelocity(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.velocity(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<FinancialVelocityPoint[]>(buildUrl('/api/financial/velocity', { timeframe, tenantId, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useAccumulatedRevenue(timeframe: string, tenantId?: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.accumulatedRevenue(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<AccumulatedRevenuePointDto[]>(buildUrl('/api/financial/accumulated-revenue', { timeframe, tenantId, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useGrowthExtremes(timeframe: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.extremes(timeframe, comparison),
    queryFn: () => apiFetch<GrowthExtreme[]>(buildUrl('/api/financial/growth-extremes', { timeframe, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useMomentum(timeframe: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.momentum(timeframe, comparison),
    queryFn: () => apiFetch<MomentumResponse>(buildUrl('/api/financial/momentum', { timeframe, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useRevenueEfficiency(timeframe: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.revenueEfficiency(timeframe, comparison),
    queryFn: () => apiFetch<RevenueEfficiencyResponse>(buildUrl('/api/financial/revenue-efficiency', { timeframe, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useVolumeAnomaly(timeframe: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.volumeAnomaly(timeframe, comparison),
    queryFn: () => apiFetch<VolumeAnomalyResponseDto[]>(buildUrl('/api/financial/volume-anomaly', { timeframe, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useCumulativeGrowthDelta(timeframe: string, tenantId: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.delta(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<CumulativeGrowthDeltaPoint[]>(buildUrl('/api/financial/cumulative-growth-delta', { timeframe, tenantId, comparison })),
    enabled: !!tenantId,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useOrderDistribution(timeframe: string, tenantId: string, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.orders(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<OrderBin[]>(buildUrl('/api/financial/order-distribution', { timeframe, tenantId, comparison })),
    enabled: !!tenantId,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}

export function useTransactionDensity(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useQuery({
    queryKey: financialKeys.transactionDensity(timeframe, tenantId, comparison),
    queryFn: () => apiFetch<TransactionDensityPointDto[]>(buildUrl('/api/financial/transaction-density', { timeframe, tenantId, comparison })),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}
