import { useSearch, useNavigate } from '@tanstack/react-router';
import { useMemo, useCallback } from 'react';
import { 
  useGlobalKpis, 
  useAccumulatedRevenue, 
  useGrowthExtremes, 
  useMomentum, 
  useRevenueEfficiency,
  useVolumeAnomaly
} from './useFinancialQueries';
import type { Timeframe } from '../schemas';

export function useFinancialViewModel() {
  const search = useSearch({ strict: false }) as { tenantId?: string, timeframe: Timeframe };
  const tenantId = search.tenantId;
  const timeframe = search.timeframe; // Re-hydrated by beforeLoad
  
  const navigate = useNavigate({ from: '/financial' });

  const kpiQuery = useGlobalKpis(timeframe);
  const velocityQuery = useAccumulatedRevenue(timeframe, undefined, 'YearOverYear');
  const extremesQuery = useGrowthExtremes(timeframe);
  const momentumQuery = useMomentum(timeframe);
  const efficiencyQuery = useRevenueEfficiency(timeframe);
  const anomalyQuery = useVolumeAnomaly(timeframe);

  const selectedTenantDetails = useMemo(() => {
    const efficiencyTenants = efficiencyQuery.data?.tenants;
    const momentumTenants = momentumQuery.data?.tenants;

    const tenantName = extremesQuery.data?.find(e => e.tenantId === tenantId)?.tenantName 
      || efficiencyTenants?.find((d) => d.tenantId === tenantId)?.tenantName 
      || anomalyQuery.data?.find(a => a.tenantId === tenantId)?.tenantName
      || momentumTenants?.find((t) => t.tenantId === tenantId)?.tenantName
      || 'Unknown Tenant';

    const type = efficiencyTenants?.find((d) => d.tenantId === tenantId)?.type
      || momentumTenants?.find((t) => t.tenantId === tenantId)?.type
      || 'Mixed';
      
    return { tenantName, type };
  }, [tenantId, extremesQuery.data, efficiencyQuery.data, anomalyQuery.data, momentumQuery.data]);

  const handleTenantSelect = useCallback((id: string) => {
    void navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, tenantId: id }) });
  }, [navigate]);

  const handleBackToGlobal = useCallback(() => {
    void navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, tenantId: undefined }) });
  }, [navigate]);

  return {
    timeframe,
    tenantId,
    selectedTenantDetails,
    kpiQuery,
    velocityQuery,
    extremesQuery,
    momentumQuery,
    efficiencyQuery,
    anomalyQuery,
    handleTenantSelect,
    handleBackToGlobal
  };
}
