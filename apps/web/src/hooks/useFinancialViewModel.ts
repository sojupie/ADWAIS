import { useSearch, useNavigate } from '@tanstack/react-router';
import { useMemo, useCallback } from 'react';
import { 
  useGlobalKpis, 
  useAccumulatedRevenue, 
  useMomentum, 
  useRevenueEfficiency,
  useTransactionDensity
} from './useFinancialQueries';
import type { Timeframe } from '../schemas';

export function useFinancialViewModel() {
  const search = useSearch({ strict: false }) as { tenantId?: string, timeframe: Timeframe };
  const tenantId = search.tenantId;
  const timeframe = search.timeframe; // Re-hydrated by beforeLoad
  
  const navigate = useNavigate({ from: '/financial' });

  const kpiQuery = useGlobalKpis(timeframe);
  const velocityQuery = useAccumulatedRevenue(timeframe, undefined, 'YearOverYear');
  const momentumQuery = useMomentum(timeframe, 'YearOverYear');
  const efficiencyQuery = useRevenueEfficiency(timeframe, 'YearOverYear');
  const densityQuery = useTransactionDensity(timeframe);

  const selectedTenantDetails = useMemo(() => {
    const efficiencyTenants = efficiencyQuery.data?.tenants;
    const momentumTenants = momentumQuery.data?.tenants;

    const tenantName = efficiencyTenants?.find((d) => d.tenantId === tenantId)?.tenantName
      || momentumTenants?.find((t) => t.tenantId === tenantId)?.tenantName
      || 'Unknown Tenant';

    const type = efficiencyTenants?.find((d) => d.tenantId === tenantId)?.type
      || momentumTenants?.find((t) => t.tenantId === tenantId)?.type
      || 'Mixed';
      
    return { tenantName, type };
  }, [tenantId, efficiencyQuery.data, momentumQuery.data]);

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
    momentumQuery,
    efficiencyQuery,
    densityQuery,
    handleTenantSelect,
    handleBackToGlobal
  };
}
