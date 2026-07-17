import { keepPreviousData } from '@tanstack/react-query';
import { 
  useGetApiFinancialKpis,
  useGetApiFinancialVelocity,
  useGetApiFinancialAccumulatedRevenue,
  useGetApiFinancialGrowthExtremes,
  useGetApiFinancialMomentum,
  useGetApiFinancialRevenueEfficiency,
  useGetApiFinancialVolumeAnomaly,
  useGetApiFinancialCumulativeGrowthDelta,
  useGetApiFinancialOrderDistribution,
  useGetApiFinancialTransactionDensity
} from '../api/generated/endpoints';
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
  TransactionDensityResponseDto,
  TransactionDensityPeriod,
  Timeframe,
  ComparisonType
} from '@types';

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
  transactionDensity: (period: TransactionDensityPeriod, tenantId?: string | null) => [...financialKeys.all, 'transactionDensity', period, tenantId] as const,
};

const REFETCH_INTERVAL = 60000;

export function useGlobalKpis(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useGetApiFinancialKpis<GlobalKpi, Error>(
    { timeframe: timeframe as Timeframe, tenantId: tenantId || undefined, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.kpis(timeframe, tenantId, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as GlobalKpi
      }
    }
  );
}

export function useFinancialVelocity(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) {
  return useGetApiFinancialVelocity<FinancialVelocityPoint[], Error>(
    { timeframe: timeframe as Timeframe, tenantId: tenantId || undefined, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.velocity(timeframe, tenantId, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as FinancialVelocityPoint[]
      }
    }
  );
}

export function useAccumulatedRevenue(timeframe: string, tenantId?: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialAccumulatedRevenue<AccumulatedRevenuePointDto[], Error>(
    { timeframe: timeframe as Timeframe, tenantId, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.accumulatedRevenue(timeframe, tenantId, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as AccumulatedRevenuePointDto[]
      }
    }
  );
}

export function useGrowthExtremes(timeframe: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialGrowthExtremes<GrowthExtreme[], Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.extremes(timeframe, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as GrowthExtreme[]
      }
    }
  );
}

export function useMomentum(timeframe: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialMomentum<MomentumResponse, Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.momentum(timeframe, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as MomentumResponse
      }
    }
  );
}

export function useRevenueEfficiency(timeframe: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialRevenueEfficiency<RevenueEfficiencyResponse, Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.revenueEfficiency(timeframe, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as RevenueEfficiencyResponse
      }
    }
  );
}

export function useVolumeAnomaly(timeframe: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialVolumeAnomaly<VolumeAnomalyResponseDto[], Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.volumeAnomaly(timeframe, comparison),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as VolumeAnomalyResponseDto[]
      }
    }
  );
}

export function useCumulativeGrowthDelta(timeframe: string, tenantId: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialCumulativeGrowthDelta<CumulativeGrowthDeltaPoint[], Error>(
    { timeframe: timeframe as Timeframe, tenantId, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.delta(timeframe, tenantId, comparison),
        enabled: !!tenantId,
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as CumulativeGrowthDeltaPoint[]
      }
    }
  );
}

export function useOrderDistribution(timeframe: string, tenantId: string, comparison?: ComparisonPeriod) {
  return useGetApiFinancialOrderDistribution<OrderBin[], Error>(
    { timeframe: timeframe as Timeframe, tenantId, comparison: comparison as ComparisonType },
    {
      query: {
        queryKey: financialKeys.orders(timeframe, tenantId, comparison),
        enabled: !!tenantId,
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as OrderBin[]
      }
    }
  );
}

export function useTransactionDensity(period: TransactionDensityPeriod, tenantId?: string | null) {
  return useGetApiFinancialTransactionDensity<TransactionDensityResponseDto, Error>(
    { period, tenantId: tenantId || undefined },
    {
      query: {
        queryKey: financialKeys.transactionDensity(period, tenantId),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data
      }
    }
  );
}
