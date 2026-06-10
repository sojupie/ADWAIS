import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query';
import { useSearch, useParams, useRouterState } from '@tanstack/react-router';
import { apiFetch } from '../../../apiClient';
import type { SystemHealthDto, TenantResponseDto } from '@types';
import { RefreshCw, AlertCircle } from 'lucide-react';

function timeAgo(date: string | number | null | undefined): string {
  if (!date) return 'Never';
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SyncStatusWidget() {
  const queryClient = useQueryClient();
  const search = useSearch({ strict: false }) as { tenantId?: string };
  const params = useParams({ strict: false }) as { tenantId?: string };
  const matches = useRouterState({ select: (s) => s.matches });
  
  const isFinancial = matches.some((m) => m.routeId === '/financial' || m.pathname.includes('/financial'));
  const isFleet = matches.some((m) => m.routeId === '/fleet-status' || m.pathname.includes('/fleet-status'));
  
  const tenantId = search?.tenantId || params?.tenantId;

  const { data: health } = useQuery<SystemHealthDto>({
    queryKey: ['system-health'],
    queryFn: () => apiFetch<SystemHealthDto>('/api/system/health'),
    refetchInterval: 60000,
    enabled: isFinancial || isFleet,
  });

  const { data: tenants } = useQuery<TenantResponseDto[]>({
    queryKey: ['tenant', tenantId],
    queryFn: () => apiFetch<TenantResponseDto[]>(`/api/tenants?id=${tenantId}`),
    enabled: !!tenantId && (isFinancial || isFleet),
    refetchInterval: 60000,
  });
  
  const tenant = tenants?.[0];

  const isFetchingCount = useIsFetching({ queryKey: isFinancial ? ['financial'] : isFleet ? ['fleet'] : ['disabled-key'] });
  const isFetching = isFetchingCount > 0;
  
  const [isHovered, setIsHovered] = useState(false);
  const [dashboardSyncTime, setDashboardSyncTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!isFinancial && !isFleet) return;
    const updateDashboardSync = () => {
      const queries = queryClient.getQueryCache().findAll({ queryKey: isFinancial ? ['financial'] : ['fleet'] });
      const maxTime = Math.max(...queries.map(q => q.state.dataUpdatedAt), 0);
      setDashboardSyncTime(maxTime > 0 ? maxTime : null);
    };

    updateDashboardSync();
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') {
        const queryKey = event.query.queryKey;
        if (queryKey.includes(isFinancial ? 'financial' : 'fleet')) {
           updateDashboardSync();
           setCountdown(60); // Reset countdown on successful fetch
        }
      }
    });

    return unsubscribe;
  }, [queryClient, isFinancial, isFleet]);

  useEffect(() => {
    if (!isFinancial && !isFleet) return;
    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinancial, isFleet]);

  const forceFetch = () => {
    setCountdown(60);
    queryClient.invalidateQueries({ queryKey: ['financial'] });
    queryClient.invalidateQueries({ queryKey: ['fleet'] });
    queryClient.invalidateQueries({ queryKey: ['system-health'] });
    if (tenantId) queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
  };

  const isDrillDown = !!tenantId;
  const syncError = isDrillDown ? tenant?.lastSyncError : health?.sync?.globalSyncError;
  const strokeColor = syncError ? 'text-red-500' : 'text-[#51B5B9]';

  const progress = ((60 - countdown) / 60) * 100;

  if (!isFinancial && !isFleet) return null;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-3 py-2 border rounded-sm shadow-sm bg-brand-bg-secondary border-brand-bg-secondary/20 w-full md:w-auto max-w-100 md:max-w-none transition-all duration-350 ease-out
        ${isHovered ? 'xl:w-auto xl:opacity-100 xl:shadow-lg' : 'xl:w-[46px] xl:opacity-40 xl:overflow-hidden xl:px-2'}
      `}
    >
      {/* Timer Wheel */}
      <div className="relative w-6 h-6 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/10" />
          <circle 
            cx="18" cy="18" r="16" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="4" 
            strokeDasharray="100, 100"
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            className={`${strokeColor} transition-all duration-1000 ease-linear`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/60 font-mono">
          {countdown}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isDrillDown ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Dashboard UI</span>
              <span className="text-xs font-bold text-white truncate min-w-10 text-right">{timeAgo(dashboardSyncTime)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Source Polled</span>
              <span className="text-xs font-bold text-white truncate min-w-10 text-right">{timeAgo(tenant?.lastPolled)}</span>
            </div>
          </div>
        ) : isFinancial ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Dashboard UI</span>
              <span className="text-xs font-bold text-white truncate min-w-10 text-right">{timeAgo(dashboardSyncTime)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Litium Sync</span>
              <span className="text-xs font-bold text-white truncate min-w-10 text-right">{timeAgo(health?.lastLitiumSync)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 items-center">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Dash UI</span>
              <span className="text-xs font-bold text-white truncate text-right">{timeAgo(dashboardSyncTime)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Meta</span>
              <span className="text-xs font-bold text-white truncate text-right">{timeAgo(health?.lastFleetUpdate)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Uptime</span>
              <span className="text-xs font-bold text-white truncate text-right">{timeAgo(health?.lastFleetUptimeUpdate)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Latency</span>
              <span className="text-xs font-bold text-white truncate text-right">{timeAgo(health?.lastFleetLatencyUpdate)}</span>
            </div>
          </div>
        )}
        
        {syncError && (
          <div className="mt-1 flex items-start gap-1 text-red-600 text-xs font-bold bg-red-50 p-1.5 rounded border border-red-100">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <span className="leading-tight line-clamp-2" title={syncError}>{syncError}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="pl-3 border-l border-white/10 ml-1">
        <button 
          onClick={forceFetch}
          disabled={isFetching}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-transparent transition-colors disabled:opacity-50"
          title="Force Fetch"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
