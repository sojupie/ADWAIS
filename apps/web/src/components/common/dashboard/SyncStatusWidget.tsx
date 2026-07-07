import { useEffect, useRef, useState } from 'react';
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

function CountdownRing({resetKey, syncError}: { resetKey: number; syncError: boolean }) {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let countdown = 60;

    const renderCountdown = () => {
      const progress = ((60 - countdown) / 60) * 100;

      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(100 - progress);
      }

      if (textRef.current) {
        textRef.current.textContent = String(countdown);
      }
    };

    renderCountdown();

    const timer = window.setInterval(() => {
      countdown = Math.max(0, countdown - 1);
      renderCountdown();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resetKey]);

  return (
    <div className="relative w-6 h-6 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/10" />
        <circle
          ref={circleRef}
          cx="18" cy="18" r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="100, 100"
          strokeDashoffset="100"
          strokeLinecap="round"
          className={`${syncError ? 'text-red-500' : 'text-[#51B5B9]'} transition-all duration-1000 ease-linear`}
        />
      </svg>
      <div ref={textRef} className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/60 font-mono">
        60
      </div>
    </div>
  );
}

export function SyncStatusWidget() {
  const queryClient = useQueryClient();
  const search = useSearch({ strict: false }) as { tenantId?: string };
  const params = useParams({ strict: false }) as { tenantId?: string };
  const matches = useRouterState({ select: (s) => s.matches });

  const isFinancial = matches.some((m) => m.routeId === '/financial' || m.pathname.includes('/financial'));
  const isFleet = matches.some((m) => m.routeId === '/fleet-status' || m.pathname.includes('/fleet-status'));

  const tenantId = search?.tenantId || params?.tenantId;

  const { data: health, isLoading: isHealthLoading } = useQuery<SystemHealthDto>({
    queryKey: ['system-health'],
    queryFn: () => apiFetch<SystemHealthDto>('/api/system/health'),
    refetchInterval: 60000,
    enabled: isFinancial || isFleet,
  });

  const { data: tenants, isLoading: isTenantsLoading } = useQuery<TenantResponseDto[]>({
    queryKey: ['tenant', tenantId],
    queryFn: () => apiFetch<TenantResponseDto[]>(`/api/tenants?id=${tenantId}`),
    enabled: !!tenantId && (isFinancial || isFleet),
    refetchInterval: 60000,
  });

  const tenant = tenants?.[0];

  const isFetchingCount = useIsFetching({ queryKey: isFinancial ? ['financial'] : isFleet ? ['fleet'] : ['disabled-key'] });
  const isFetching = isFetchingCount > 0;

  const isDrillDown = !!tenantId;
  const isHealthLoadingActual = isHealthLoading && (isFinancial || isFleet);
  const isTenantsLoadingActual = isTenantsLoading && isDrillDown;
  const isLoading = isDrillDown ? isTenantsLoadingActual : isHealthLoadingActual;

  const renderTime = (time: string | number | null | undefined, isTimeLoading: boolean) => {
    if (isTimeLoading || (!time && isFetching)) {
      return <div className="h-3.5 w-12 bg-white/15 rounded animate-pulse inline-block" />;
    }
    return timeAgo(time);
  };

  const [dashboardSyncTime, setDashboardSyncTime] = useState<number | null>(null);
  const [countdownResetKey, setCountdownResetKey] = useState(0);

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
          setCountdownResetKey((current) => current + 1);
        }
      }
    });

    return unsubscribe;
  }, [queryClient, isFinancial, isFleet]);

  const forceFetch = () => {
    setCountdownResetKey((current) => current + 1);
    queryClient.invalidateQueries({ queryKey: ['financial'] });
    queryClient.invalidateQueries({ queryKey: ['fleet'] });
    queryClient.invalidateQueries({ queryKey: ['system-health'] });
    queryClient.invalidateQueries({ queryKey: ['/api/financial/orders'] });
    if (tenantId) queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
  };

  const syncError = isDrillDown ? tenant?.lastSyncError : health?.sync?.globalSyncError;

  if (!isFinancial && !isFleet) return null;

  return (
    <div
      className="flex items-center gap-4 px-5 py-3 border rounded-xl shadow-sm bg-brand-bg-secondary border-brand-bg-secondary/20 min-h-14 min-w-0"
    >
      {/* Timer Wheel */}
      <CountdownRing resetKey={countdownResetKey} syncError={!!syncError} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isDrillDown ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Dashboard UI</span>
              <span className="text-sm font-bold text-white truncate min-w-10 text-right">{renderTime(dashboardSyncTime, isFetching)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Source Polled</span>
              <span className="text-sm font-bold text-white truncate min-w-10 text-right">{renderTime(tenant?.lastPolled, isLoading)}</span>
            </div>
          </div>
        ) : isFinancial ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Dashboard UI</span>
              <span className="text-sm font-bold text-white truncate min-w-10 text-right">{renderTime(dashboardSyncTime, isFetching)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Litium Sync</span>
              <span className="text-sm font-bold text-white truncate min-w-10 text-right">{renderTime(health?.lastLitiumSync, isLoading)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 items-center">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Dash UI</span>
              <span className="text-sm font-bold text-white text-right">{renderTime(dashboardSyncTime, isFetching)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Meta</span>
              <span className="text-sm font-bold text-white text-right">{renderTime(health?.lastFleetUpdate, isLoading)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Uptime</span>
              <span className="text-sm font-bold text-white text-right">{renderTime(health?.lastFleetUptimeUpdate, isLoading)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Latency</span>
              <span className="text-sm font-bold text-white text-right">{renderTime(health?.lastFleetLatencyUpdate, isLoading)}</span>
            </div>
          </div>
        )}

        {syncError && (
          <div className="mt-1 flex items-start gap-1 text-red-600 text-sm font-bold bg-red-50 p-1.5 rounded border border-red-100">
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
