import { Play, Activity, Lock, Clock } from 'lucide-react';
import { useRecurringJobsQuery, useTriggerJobMutation, useBackfillMutation, useRecentJobsQuery } from '../../hooks/useJobSettingsQueries';
import { useTenantsQuery } from '../../hooks/useTenantQueries';
import { RecurringJobsTable } from '../../components/settings/jobs/RecurringJobsTable';
import { ManualBackfillPanel } from '../../components/settings/jobs/ManualBackfillPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatDateTime } from '../../utils/dateTime';



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
                <SettingsPanelHeader
                    title="Manual Triggers & Configuration"
                    subtitle="Run synchronization and maintenance tasks on demand."
                    icon={<Activity size={24} />}
                />
                <div className="custom-scrollbar flex-1 overflow-y-auto p-3 sm:p-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {manualJobs.map(job => {
                                const isRestricted = job.isAdminOnly && role !== 'Admin';
                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => !isRestricted && triggerJob.mutate(job.url)}
                                        disabled={isRestricted}
                                        className={`group relative flex min-h-28 flex-col overflow-hidden rounded-xl p-4 text-left transition-colors ${isRestricted
                                            ? 'cursor-not-allowed bg-on-surface/[0.1] text-on-surface/[0.38] opacity-50'
                                            : 'cursor-pointer bg-primary-container text-on-surface hover:m3-elevation-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary'
                                            }`}
                                    >
                                        <div className="mb-2 flex items-center gap-3">
                                            {isRestricted ? (
                                                <Lock size={14} className="text-on-surface/[0.38]" />
                                            ) : (
                                                <Play size={18} className="text-on-primary-container transition-transform group-hover:translate-x-0.5" />
                                            )}
                                            <span className="text-base font-black">{job.name}</span>
                                            {isRestricted && (
                                                <span className="ml-auto rounded-full bg-surface px-2.5 py-1 text-sm font-bold text-on-surface-variant">Admin</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium leading-5 text-on-surface-variant">{job.desc}</span>
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
                <SettingsPanelHeader
                    title="Scheduled Jobs"
                    subtitle="Recurring schedules and recent execution history."
                    icon={<Clock size={24} />}
                />
                <div className="flex min-h-0 flex-1 flex-col gap-4 p-3 sm:p-4">
                    <div className="flex flex-col gap-4 h-full min-h-0">
                        {/* Recurring Table */}
                        <div className="flex max-h-[260px] shrink-0 flex-col overflow-y-auto rounded-xl border border-outline">
                            <RecurringJobsTable recurring={recurring} />
                        </div>

                        {/* Recent Jobs */}
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#d8cfb5] bg-[#fdf6e3] ">
                            <div className="z-10 flex shrink-0 items-center justify-between border-b border-[#d8cfb5] bg-[#eee8d5] p-4">
                                <div className="flex items-center gap-3">
                                    <Activity size={18} className="text-[#2aa198]" />
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest text-[#073642]">Recent executions</h2>
                                        <p className="mt-0.5 text-sm font-medium text-on-surface-variant">Newest dispatches first</p>
                                    </div>
                                </div>
                            </div>
                            <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto bg-[#fdf6e3] font-mono text-sm">
                                {recentJobs && recentJobs.length > 0 ? (
                                    <div className="flex flex-col divide-y divide-[#d8cfb5]">
                                        {recentJobs.map((job) => {
                                            const isProcessing = job.state === 'Processing';
                                            const isSucceeded = job.state === 'Succeeded';
                                            const isFailed = job.state === 'Failed';
                                            return (
                                                <div key={job.jobId} className="group relative flex flex-col gap-2 p-2.5 text-on-surface-variant transition-colors hover:bg-[#eee8d5]">
                                                    <div className="flex items-center justify-between gap-8 min-w-0">
                                                        <div className="flex items-center gap-6 min-w-0">
                                                            <span className="shrink-0 font-mono text-sm ">
                                                                {(() => {
                                                                    if (!job.createdAt) return 'N/A';
                                                                    const d = new Date(job.createdAt);
                                                                    const year = d.getFullYear();
                                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                    const day = String(d.getDate()).padStart(2, '0');
                                                                    const time = formatDateTime(d, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                                                    return `${year}-${month}-${day} ${time}`;
                                                                })()}
                                                            </span>
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                {isProcessing && (
                                                                    <span className="flex h-2 w-2 relative shrink-0">
                                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#268bd2] opacity-75"></span>
                                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#268bd2]"></span>
                                                                    </span>
                                                                )}
                                                                {isSucceeded && <div className="h-2 w-2 shrink-0 rounded-full bg-[#859900]"></div>}
                                                                {isFailed && <div className="h-2 w-2 shrink-0 rounded-full bg-[#dc322f]"></div>}
                                                                <span
                                                                    className="truncate font-bold text-[#073642]"
                                                                    title={job.jobName || ''}
                                                                >
                                                                    {job.jobName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm font-bold shrink-0">
                                                            {job.durationSeconds !== null && (
                                                                <span className="font-mono font-normal ">
                                                                    {job.durationSeconds.toFixed(1)}s
                                                                </span>
                                                            )}
                                                            {isProcessing && <span className="uppercase tracking-wide text-[#268bd2]">Active</span>}
                                                            {isSucceeded && <span className="uppercase tracking-wide text-[#859900]">Success</span>}
                                                            {isFailed && <span className="uppercase tracking-wide text-[#dc322f]">Failed</span>}
                                                        </div>
                                                    </div>
                                                    {job.jobArgs && (
                                                        <div className="break-all pr-4 text-sm font-normal leading-relaxed text-on-surface-variant select-text">
                                                            ({job.jobArgs})
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm font-medium text-on-surface-variant">
                                                        <span>ID: {job.jobId}</span>
                                                        {job.tenantName && (
                                                            <span className="text-[#2aa198]">Tenant: <strong className="">{job.tenantName}</strong></span>
                                                        )}
                                                        {job.monitorName && (
                                                            <span className="text-[#2aa198]">Monitor: <strong className="">{job.monitorName}</strong></span>
                                                        )}
                                                    </div>
                                                    {isFailed && job.exceptionMessage && (
                                                        <div className="custom-scrollbar mt-1.5 overflow-x-auto rounded border border-[#dc322f]/40 bg-[#fbe5df] p-2 text-sm text-[#b52f2c] select-text">
                                                            <pre className="whitespace-pre-wrap">{job.exceptionMessage}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm font-semibold tracking-wide text-on-surface-variant">
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
