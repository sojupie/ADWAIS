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
  ComparisonType,
  TenantType
} from '@types';

export const financialKeys = {
  all: ['financial'] as const,
  kpis: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'kpis', timeframe, tenantId, comparison, tenantTypes] as const,
  velocity: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'velocity', timeframe, tenantId, comparison, tenantTypes] as const,
  extremes: (timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'extremes', timeframe, comparison, tenantTypes] as const,
  momentum: (timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'momentum', timeframe, comparison, tenantTypes] as const,
  revenueEfficiency: (timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'revenueEfficiency', timeframe, comparison, tenantTypes] as const,
  volumeAnomaly: (timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'volumeAnomaly', timeframe, comparison, tenantTypes] as const,
  delta: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'delta', timeframe, tenantId, comparison, tenantTypes] as const,
  orders: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod) => [...financialKeys.all, 'orders', timeframe, tenantId, comparison] as const,
  accumulatedRevenue: (timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) => [...financialKeys.all, 'accumulatedRevenue', timeframe, tenantId, comparison, tenantTypes] as const,
  transactionDensity: (period: TransactionDensityPeriod, tenantId?: string | null, tenantTypes?: TenantType[]) => [...financialKeys.all, 'transactionDensity', period, tenantId, tenantTypes] as const,
};

const REFETCH_INTERVAL = 60000;

export function useGlobalKpis(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialKpis<GlobalKpi, Error>(
    { timeframe: timeframe as Timeframe, tenantId: tenantId || undefined, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.kpis(timeframe, tenantId, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as GlobalKpi
      }
    }
  );
}

export function useFinancialVelocity(timeframe: string, tenantId?: string | null, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialVelocity<FinancialVelocityPoint[], Error>(
    { timeframe: timeframe as Timeframe, tenantId: tenantId || undefined, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.velocity(timeframe, tenantId, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as FinancialVelocityPoint[]
      }
    }
  );
}

export function useAccumulatedRevenue(timeframe: string, tenantId?: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialAccumulatedRevenue<AccumulatedRevenuePointDto[], Error>(
    { timeframe: timeframe as Timeframe, tenantId, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.accumulatedRevenue(timeframe, tenantId, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as AccumulatedRevenuePointDto[]
      }
    }
  );
}

export function useGrowthExtremes(timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialGrowthExtremes<GrowthExtreme[], Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.extremes(timeframe, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as GrowthExtreme[]
      }
    }
  );
}

export function useMomentum(timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialMomentum<MomentumResponse, Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.momentum(timeframe, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as MomentumResponse
      }
    }
  );
}

export function useRevenueEfficiency(timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialRevenueEfficiency<RevenueEfficiencyResponse, Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.revenueEfficiency(timeframe, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as RevenueEfficiencyResponse
      }
    }
  );
}

export function useVolumeAnomaly(timeframe: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialVolumeAnomaly<VolumeAnomalyResponseDto[], Error>(
    { timeframe: timeframe as Timeframe, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.volumeAnomaly(timeframe, comparison, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data as VolumeAnomalyResponseDto[]
      }
    }
  );
}

export function useCumulativeGrowthDelta(timeframe: string, tenantId: string, comparison?: ComparisonPeriod, tenantTypes?: TenantType[]) {
  return useGetApiFinancialCumulativeGrowthDelta<CumulativeGrowthDeltaPoint[], Error>(
    { timeframe: timeframe as Timeframe, tenantId, comparison: comparison as ComparisonType, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.delta(timeframe, tenantId, comparison, tenantTypes),
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

export function useTransactionDensity(period: TransactionDensityPeriod, tenantId?: string | null, tenantTypes?: TenantType[]) {
  return useGetApiFinancialTransactionDensity<TransactionDensityResponseDto, Error>(
    { period, tenantId: tenantId || undefined, tenantTypes: tenantTypes?.length ? tenantTypes : undefined },
    {
      query: {
        queryKey: financialKeys.transactionDensity(period, tenantId, tenantTypes),
        refetchInterval: REFETCH_INTERVAL,
        placeholderData: keepPreviousData,
        select: (res) => res.data
      }
    }
  );
}
