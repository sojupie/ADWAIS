import { Play, Activity, Lock, Clock } from 'lucide-react';
import { useRecurringJobsQuery, useTriggerJobMutation, useBackfillMutation, useRecentJobsQuery } from '../../hooks/useJobSettingsQueries';
import { useTenantsQuery } from '../../hooks/useTenantQueries';
import { RecurringJobsTable } from '../../components/settings/jobs/RecurringJobsTable';
import { ManualBackfillPanel } from '../../components/settings/jobs/ManualBackfillPanel';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { useCurrentUser } from '../../hooks/useCurrentUser';



export function BackgroundJobsView() {
    const { data: recurring } = useRecurringJobsQuery();
    const { data: tenants } = useTenantsQuery();
    const { data: recentJobs } = useRecentJobsQuery();
    const { role } = useCurrentUser();

    const triggerJob = useTriggerJobMutation();
    const triggerBackfill = useBackfillMutation();

    const manualJobs = [
        { id: 'monitor-sync', name: 'Monitor Sync', desc: 'Syncs monitor states from external providers.', isAdminOnly: true, url: '/api/job/trigger/monitor-sync' },
        { id: 'uptime-sync', name: 'Uptime Sync', desc: 'Fetches latest uptime ping data.', isAdminOnly: true, url: '/api/job/trigger/uptime-sync' },
        { id: 'latency-sync', name: 'Latency Sync', desc: 'Fetches latency metrics for all monitors.', isAdminOnly: true, url: '/api/job/trigger/latency-sync' },
        { id: 'user-stats-sync', name: 'UptimeRobot User Stats', desc: 'Calculates active UptimeRobot user statistics.', isAdminOnly: true, url: '/api/job/trigger/user-stats-sync' },
        { id: 'litium-sync', name: 'Litium Sync', desc: 'Synchronizes order data from Litium.', isAdminOnly: true, url: '/api/job/trigger/litium-sync' },
        { id: 'feed-fetch', name: 'Feed Fetch', desc: 'Triggers aggregation of RSS, blogs, and newsrooms immediately.', isAdminOnly: true, url: '/api/global-config/feeds/fetch' },
        { id: 'refresh-historic-order-data', name: 'Refresh Historic Orders', desc: 'Rebuilds materialized views for old orders.', isAdminOnly: false, url: '/api/job/trigger/refresh-historic-order-data' },
        { id: 'refresh-monitoring-data', name: 'Refresh Monitoring', desc: 'Rebuilds monitoring materialized views.', isAdminOnly: false, url: '/api/job/trigger/refresh-monitoring-data' },
    ];

    return (
        <div className="grid grid-cols-1 landscape-contained:grid-cols-2 portrait-contained:grid-rows-2 gap-4 h-full min-h-0">
            {/* Top Action Section / Left Pane */}
            <SettingsPanel>
                <SectionHeader
                    title="Manual Triggers & Configuration"
                    subtitle="Force execution & settings"
                    icon={<Activity size={24} />}
                />
                <div className="flex-1 overflow-y-auto sm:p-4 custom-scrollbar bg-surface rounded-xl shadow-sm border border-outline-variant/60">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 p-3 lg:grid-cols-3 gap-3">
                            {manualJobs.map(job => {
                                const isRestricted = job.isAdminOnly && role !== 'Admin';
                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => !isRestricted && triggerJob.mutate(job.url)}
                                        disabled={isRestricted}
                                        className={`group flex flex-col text-left p-3 border rounded-xl transition-all relative overflow-hidden bg-surface-container-lowest ${isRestricted
                                            ? 'border-slate-250 opacity-40 cursor-not-allowed'
                                            : 'border-outline-variant hover:border-brand-accent hover:shadow-md cursor-pointer hover:bg-surface'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {isRestricted ? (
                                                <Lock size={14} className="text-on-surface-variant" />
                                            ) : (
                                                <Play size={14} className="text-brand-accent group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-sm font-bold text-on-surface">{job.name}</span>
                                            {isRestricted && (
                                                <span className="text-sm font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded ml-auto">Admin</span>
                                            )}
                                        </div>
                                        <span className="text-sm text-on-surface-variant font-medium">{job.desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <ManualBackfillPanel tenants={tenants} triggerBackfill={triggerBackfill} disabled={role !== 'Admin'} />
                    </div>
                </div>
            </SettingsPanel>

            {/* Scheduled Jobs Section / Right Pane */}
            <SettingsPanel>
                <SectionHeader
                    title="Scheduled Jobs"
                    subtitle="Recurring intervals & recent executions"
                    icon={<Clock size={24} />}
                />
                <div className="flex-1 flex flex-col gap-2 p-4 bg-surface rounded-xl shadow-sm border border-outline-variant/60 min-h-0">
                    <div className="flex flex-col gap-2 h-full min-h-0">
                        {/* Recurring Table */}
                        <div className="flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden shrink-0 max-h-[250px]">
                            <div className="overflow-y-auto custom-scrollbar h-full">
                                <RecurringJobsTable recurring={recurring} />
                            </div>
                        </div>

                        {/* Recent Jobs */}
                        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex-1 min-h-0">
                            <div className="flex items-center justify-between shrink-0 p-4 border-b border-slate-800 bg-slate-900 z-10">
                                <div className="flex items-center gap-3">
                                    <Activity size={18} className="text-brand-accent" />
                                    <h2 className="text-sm font-bold text-white tracking-wider">RECENT JOB DISPATCHES</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-[#0d1117] font-mono text-sm">
                                {recentJobs && recentJobs.length > 0 ? (
                                    <div className="flex flex-col divide-y divide-slate-800/50">
                                        {recentJobs.map((job) => {
                                            const isProcessing = job.state === 'Processing';
                                            const isSucceeded = job.state === 'Succeeded';
                                            const isFailed = job.state === 'Failed';
                                            return (
                                                <div key={job.jobId} className="flex flex-col p-2.5 hover:bg-surface/5 transition-colors gap-1 group text-slate-300 relative">
                                                    <div className="flex items-center justify-between gap-4 min-w-0">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-on-surface-variant shrink-0 text-xs font-mono">
                                                                {(() => {
                                                                    if (!job.createdAt) return 'N/A';
                                                                    const d = new Date(job.createdAt);
                                                                    const year = d.getFullYear();
                                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                    const day = String(d.getDate()).padStart(2, '0');
                                                                    const time = d.toLocaleTimeString([], { hour12: false });
                                                                    return `${year}-${month}-${day} ${time}`;
                                                                })()}
                                                            </span>
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {isProcessing && (
                                                                    <span className="flex h-2 w-2 relative shrink-0">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                                    </span>
                                                                )}
                                                                {isSucceeded && <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>}
                                                                {isFailed && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>}
                                                                <span
                                                                    className="font-bold text-slate-200 truncate"
                                                                    title={job.jobName || ''}
                                                                >
                                                                    {job.jobName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                                                            {job.durationSeconds !== null && (
                                                                <span className="font-mono text-on-surface-variant font-normal">
                                                                    {job.durationSeconds.toFixed(1)}s
                                                                </span>
                                                            )}
                                                            {isProcessing && <span className="text-blue-400 tracking-wide uppercase">Active</span>}
                                                            {isSucceeded && <span className="text-green-500 tracking-wide uppercase">Success</span>}
                                                            {isFailed && <span className="text-red-400 tracking-wide uppercase">Failed</span>}
                                                        </div>
                                                    </div>
                                                    {job.jobArgs && (
                                                        <div className="text-xs text-on-surface-variant font-normal leading-relaxed pr-4 break-all select-text">
                                                            ({job.jobArgs})
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-medium">
                                                        <span>ID: {job.jobId}</span>
                                                        {job.tenantName && (
                                                            <span className="text-brand-accent">Tenant: <strong className="text-slate-350">{job.tenantName}</strong></span>
                                                        )}
                                                        {job.monitorName && (
                                                            <span className="text-brand-accent">Monitor: <strong className="text-slate-350">{job.monitorName}</strong></span>
                                                        )}
                                                    </div>
                                                    {isFailed && job.exceptionMessage && (
                                                        <div className="mt-1.5 p-2 bg-red-950/30 border border-red-900/50 rounded text-red-200/80 text-xs overflow-x-auto custom-scrollbar select-text">
                                                            <pre className="whitespace-pre-wrap">{job.exceptionMessage}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-on-surface-variant text-sm font-semibold tracking-wide">
                                        No recent background jobs found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsPanel>
        </div>
    );
}
