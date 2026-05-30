import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeartPulse, TerminalSquare, AlertCircle, CheckCircle2, Info, AlertTriangle, Activity, Copy, Check } from 'lucide-react';
import { apiFetch } from '../../apiClient';
import type { SystemHealthDto, BackgroundJobStatusDto } from '@types';

interface SystemEvent {
  id?: string | number;
  timestamp: string;
  level?: string;
  message: string;
  exception?: string;
  tenantId?: string | null;
  tenant?: {
    id: string;
    name: string;
  } | null;
}

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

export const Route = createFileRoute('/settings/events')({
  component: SystemEventsView,
});

function SystemEventsView() {
  const queryClient = useQueryClient();

  const { data: health } = useQuery<SystemHealthDto>({
    queryKey: ['system-health'],
    queryFn: () => apiFetch<SystemHealthDto>('/api/system/health'),
    refetchInterval: 30000
  });

  const { data: events } = useQuery<SystemEvent[]>({
    queryKey: ['system-events'],
    queryFn: () => apiFetch<SystemEvent[]>('/api/SystemEvent?take=30'),
    refetchInterval: 30000
  });

  const { data: jobs } = useQuery<BackgroundJobStatusDto[]>({
    queryKey: ['system-jobs'],
    queryFn: () => apiFetch<BackgroundJobStatusDto[]>('/api/system/health/jobs'),
    refetchInterval: 15000
  });

  const clearErrorsMutation = useMutation({
    mutationFn: () => apiFetch('/api/system/health/clear-errors', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
    }
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full min-h-0">
      
      {/* Diagnostics / Health Panel */}
      <section className="flex flex-col h-full col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-brand-bg-secondary border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 text-white rounded-lg shadow-sm">
              <HeartPulse size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Pipeline Health</h2>
              <p className="text-xs font-semibold text-slate-300">Live connectivity</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar bg-slate-50/50">
          {health ? (
            <div className="flex flex-col gap-4">
              
              {/* Database Health Card */}
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Database Status</span>
                  <span className="text-xs text-slate-400">Core database connection</span>
                </div>
                {health.databaseStatus === 'Healthy' ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    <CheckCircle2 size={13} /> OK
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200">
                    <AlertCircle size={13} /> ERR
                  </span>
                )}
              </div>

              {/* Sync Pipeline Health Card */}
              <div className="flex flex-col p-3 border border-slate-200 rounded-xl bg-white shadow-sm gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Sync Status</span>
                    <span className="text-xs text-slate-400">Monitoring & order ingestion</span>
                  </div>
                  {health.sync?.status === 'Healthy' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                      <CheckCircle2 size={13} /> OK
                    </span>
                  )}
                  {health.sync?.status === 'Degraded' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                      <AlertTriangle size={13} /> WARN
                    </span>
                  )}
                  {health.sync?.status === 'Failed' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200">
                      <AlertCircle size={13} /> ERR
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs border-t border-slate-100 pt-2 text-slate-500">
                  <div>Tenants with errors: <span className="font-bold text-slate-800">{health.sync?.tenantsWithErrorsCount}</span></div>
                  <div>Monitors with errors: <span className="font-bold text-slate-800">{health.sync?.monitorsWithErrorsCount}</span></div>
                </div>
                {health.sync?.globalSyncError && (
                  <div className="mt-1 p-2 bg-red-50 text-red-800 border border-red-100 rounded text-xs leading-tight font-medium">
                    {health.sync.globalSyncError}
                  </div>
                )}
              </div>

              {/* Hangfire Background Health Card */}
              <div className="flex flex-col p-3 border border-slate-200 rounded-xl bg-white shadow-sm gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Hangfire Status</span>
                    <span className="text-xs text-slate-400">Scheduler worker queues</span>
                  </div>
                  {health.hangfire?.status === 'Healthy' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                      <CheckCircle2 size={13} /> OK
                    </span>
                  )}
                  {health.hangfire?.status === 'Warning' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                      <AlertTriangle size={13} /> WARN
                    </span>
                  )}
                  {health.hangfire?.status === 'Failed' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200">
                      <AlertCircle size={13} /> ERR
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1 mt-1 text-center border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                  <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                    <span className="font-extrabold text-slate-850">{health.hangfire?.processingCount}</span>
                    <span>Active</span>
                  </div>
                  <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                    <span className="font-extrabold text-slate-850">{health.hangfire?.enqueuedCount}</span>
                    <span>Queued</span>
                  </div>
                  <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                    <span className="font-extrabold text-slate-850">{health.hangfire?.scheduledCount}</span>
                    <span>Scheduled</span>
                  </div>
                  <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                    <span className={`font-extrabold ${health.hangfire?.failedCount > 0 ? 'text-red-650' : 'text-slate-850'}`}>{health.hangfire?.failedCount}</span>
                    <span>Failed</span>
                  </div>
                </div>
              </div>

              {/* Clear Errors Action */}
              <button
                onClick={() => clearErrorsMutation.mutate()}
                disabled={clearErrorsMutation.isPending}
                className="w-full py-2.5 px-4 bg-slate-150 hover:bg-slate-200 active:bg-slate-250 text-slate-700 font-bold rounded-xl text-xs shadow-sm transition-colors border border-slate-250 disabled:opacity-50"
              >
                {clearErrorsMutation.isPending ? 'Clearing Diagnostics...' : 'Clear Sync Errors'}
              </button>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-16 bg-slate-200/70 rounded-xl"></div>
              <div className="h-28 bg-slate-200/70 rounded-xl"></div>
              <div className="h-28 bg-slate-200/70 rounded-xl"></div>
            </div>
          )}

          {/* Sync Dates Section */}
          {health && (
            <div className="flex flex-col border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-400 uppercase tracking-widest">
                Last Successful Syncs
              </div>
              <div className="flex flex-col divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center p-3">
                  <span className="font-semibold text-slate-600">Litium Ingestion</span>
                  <span className="font-bold text-slate-800">{timeAgo(health.lastLitiumSync)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="font-semibold text-slate-600">Fleet Meta Update</span>
                  <span className="font-bold text-slate-800">{timeAgo(health.lastFleetUpdate)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="font-semibold text-slate-600">Uptimerobot Sync</span>
                  <span className="font-bold text-slate-800">{timeAgo(health.lastFleetUptimeUpdate)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="font-semibold text-slate-600">Latencyrobot Sync</span>
                  <span className="font-bold text-slate-800">{timeAgo(health.lastFleetLatencyUpdate)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Status Grid (Jobs + Logs) */}
      <div className="flex flex-col col-span-1 xl:col-span-2 gap-6 h-full min-h-0">
        
        {/* Background Jobs Panel */}
        <section className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[320px] shrink-0">
          <div className="flex items-center justify-between shrink-0 p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-slate-500" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Recent Background Jobs</h2>
            </div>
            <div className="text-[10px] font-bold text-slate-400">Updates every 15s</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/20">
            {jobs && jobs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {jobs.map((job) => {
                  const isProcessing = job.state === 'Processing';
                  const isSucceeded = job.state === 'Succeeded';
                  const isFailed = job.state === 'Failed';
                  return (
                    <div key={job.jobId} className="flex flex-col p-3 border border-slate-150 bg-white rounded-xl shadow-xs gap-1.5">
                      <div className="flex items-center justify-between gap-4 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {isProcessing && (
                            <span className="flex h-2.5 w-2.5 relative shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                          )}
                          {isSucceeded && <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0"></span>}
                          {isFailed && <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0"></span>}
                          <span 
                            className="text-xs font-bold text-slate-700 truncate" 
                            title={`${job.jobName}${job.jobArgs ? `(${job.jobArgs})` : ''}`}
                          >
                            {job.jobName}
                            {job.jobArgs && (
                              <span className="ml-1.5 text-[9px] font-mono text-slate-400 font-normal bg-slate-50 border border-slate-200/60 rounded px-1.5 py-0.5">
                                {job.jobArgs}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
                          {isProcessing && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>}
                          {isSucceeded && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Success</span>}
                          {isFailed && <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Failed</span>}
                          <span className="text-slate-400">{timeAgo(job.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>ID: <code className="font-mono bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[9px]">{job.jobId}</code></span>
                        {job.durationSeconds !== null && (
                          <span>Duration: <span className="font-bold text-slate-650">{job.durationSeconds.toFixed(1)}s</span></span>
                        )}
                      </div>
                      {isFailed && job.exceptionMessage && (
                        <div className="mt-1.5 p-2.5 bg-red-950/5 border border-red-200/50 text-[10px] text-red-700 font-mono rounded leading-tight whitespace-pre-wrap max-h-[70px] overflow-y-auto custom-scrollbar">
                          {job.exceptionMessage}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                No recent background jobs found
              </div>
            )}
          </div>
        </section>

        {/* System Logs console */}
        <section className="flex flex-col bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden flex-1 min-h-0">
          <div className="flex items-center justify-between shrink-0 p-4 border-b border-slate-800 bg-slate-900 z-10">
            <div className="flex items-center gap-3">
              <TerminalSquare size={18} className="text-brand-accent" />
              <h2 className="text-sm font-bold text-white tracking-wider">SYSTEM LOGS</h2>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2 bg-[#0d1117] font-mono text-xs">
            {(events || []).map((e: SystemEvent, i: number) => (
              <LogEventRow key={e.id || i} e={e} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LogEventRow({ e }: { e: SystemEvent }) {
  const [copied, setCopied] = useState(false);
  const isError = e.level === 'Error';
  const isWarn = e.level === 'Warning';

  let displayMessage = e.message;
  if (e.tenant && e.tenant.name) {
    const tenantIdStr = String(e.tenant.id || e.tenantId);
    const regex = new RegExp(tenantIdStr, 'gi');
    displayMessage = displayMessage.replace(regex, e.tenant.name);
  }

  const handleCopy = () => {
    const time = new Date(e.timestamp).toLocaleTimeString([], { hour12: false });
    const levelStr = `[${(e.level || 'info').toUpperCase()}]`;
    const fullText = `${time} ${levelStr} ${displayMessage}${e.exception ? `\nException: ${e.exception}` : ''}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-start gap-4 p-1.5 rounded hover:bg-white/5 transition-colors group text-slate-300 relative">
      <span className="text-slate-500 shrink-0 mt-0.5 text-[10px]">
        {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
      </span>
      <div className="flex flex-col gap-1 w-full min-w-0">
        <div className="flex items-center gap-2 pr-8">
          {isError ? <AlertCircle size={13} className="text-red-400 shrink-0" /> : 
           isWarn ? <AlertTriangle size={13} className="text-amber-455 shrink-0" /> : 
           <Info size={13} className="text-blue-400 shrink-0" />}
          <span className={`font-bold text-[10px] shrink-0 ${isError ? 'text-red-400' : isWarn ? 'text-amber-455' : 'text-blue-400'}`}>
            [{(e.level || 'info').toUpperCase()}]
          </span>
          <span className="break-words leading-tight text-slate-200 select-text">{displayMessage}</span>
        </div>
        {e.exception && (
          <div className="mt-1.5 p-2 bg-red-950/30 border border-red-900/50 rounded text-red-200/80 text-[10px] overflow-x-auto custom-scrollbar select-text">
            <pre className="whitespace-pre-wrap">{e.exception}</pre>
          </div>
        )}
      </div>
      
      {/* Copy Button (visible on hover) */}
      <button 
        onClick={handleCopy}
        className="absolute right-2 top-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
        title="Copy full log entry"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  );
}
