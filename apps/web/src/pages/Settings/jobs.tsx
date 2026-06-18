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
        { id: 'monitor-sync', name: 'Monitor Sync', desc: 'Syncs monitor states from external providers.', isAdminOnly: true },
        { id: 'uptime-sync', name: 'Uptime Sync', desc: 'Fetches latest uptime ping data.', isAdminOnly: true },
        { id: 'latency-sync', name: 'Latency Sync', desc: 'Fetches latency metrics for all monitors.', isAdminOnly: true },
        { id: 'user-stats-sync', name: 'User Stats', desc: 'Calculates active user statistics.', isAdminOnly: true },
        { id: 'litium-sync', name: 'Litium Sync', desc: 'Synchronizes order data from Litium.', isAdminOnly: true },
        { id: 'refresh-historic-order-data', name: 'Refresh Historic Orders', desc: 'Rebuilds materialized views for old orders.', isAdminOnly: false },
        { id: 'refresh-monitoring-data', name: 'Refresh Monitoring', desc: 'Rebuilds monitoring materialized views.', isAdminOnly: false },
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
            {/* Top Action Section / Left Pane */}
            <SettingsPanel>
                <SectionHeader
                    title="Manual Triggers & Configuration"
                    subtitle="Force execution & settings"
                    icon={<Activity size={24} />}
                />
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {manualJobs.map(job => {
                                const isRestricted = job.isAdminOnly && role !== 'Admin';
                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => !isRestricted && triggerJob.mutate(`/api/job/trigger/${job.id}`)}
                                        disabled={isRestricted}
                                        className={`group flex flex-col text-left p-3 border rounded-xl transition-all relative overflow-hidden bg-slate-50/50 ${isRestricted
                                            ? 'border-slate-250 opacity-40 cursor-not-allowed'
                                            : 'border-slate-200 hover:border-brand-accent hover:shadow-md cursor-pointer hover:bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {isRestricted ? (
                                                <Lock size={14} className="text-slate-400" />
                                            ) : (
                                                <Play size={14} className="text-brand-accent group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-sm font-bold text-slate-800">{job.name}</span>
                                            {isRestricted && (
                                                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-auto">Admin</span>
                                            )}
                                        </div>
                                        <span className="text-sm text-slate-500 font-medium">{job.desc}</span>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/50">
                    <div className="flex flex-col gap-6 h-full">
                        {/* Recurring Table */}
                        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0 max-h-[250px]">
                            <div className="overflow-y-auto custom-scrollbar h-full">
                                <RecurringJobsTable recurring={recurring} />
                            </div>
                        </div>

                        {/* Recent Jobs */}
                        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex-1 min-h-0 shrink-0">
                            <div className="flex items-center justify-between shrink-0 p-4 border-b border-slate-800 bg-slate-900 z-10">
                                <div className="flex items-center gap-3">
                                    <Activity size={18} className="text-brand-accent" />
                                    <h2 className="text-sm font-bold text-white tracking-wider">RECENT EXECUTIONS</h2>
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
                                                <div key={job.jobId} className="flex flex-col p-2.5 hover:bg-white/5 transition-colors gap-1 group text-slate-300 relative">
                                                    <div className="flex items-center justify-between gap-4 min-w-0">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-slate-500 shrink-0 text-xs">
                                                                {job.createdAt ? new Date(job.createdAt).toLocaleTimeString([], { hour12: false }) : 'N/A'}
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
                                                                    title={`${job.jobName}${job.jobArgs ? `(${job.jobArgs})` : ''}`}
                                                                >
                                                                    {job.jobName}
                                                                </span>
                                                                {job.jobArgs && (
                                                                    <span className="ml-1 text-xs text-slate-500 font-normal truncate hidden sm:inline">
                                                                        ({job.jobArgs})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                                                            {job.durationSeconds !== null && (
                                                                <span className="font-mono text-slate-500 font-normal">
                                                                    {job.durationSeconds.toFixed(1)}s
                                                                </span>
                                                            )}
                                                            {isProcessing && <span className="text-blue-400 tracking-wide uppercase">Active</span>}
                                                            {isSucceeded && <span className="text-green-500 tracking-wide uppercase">Success</span>}
                                                            {isFailed && <span className="text-red-400 tracking-wide uppercase">Failed</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500 font-medium pl-[72px]">
                                                        <span>ID: {job.jobId}</span>
                                                    </div>
                                                    {isFailed && job.exceptionMessage && (
                                                        <div className="mt-1.5 ml-[72px] p-2 bg-red-950/30 border border-red-900/50 rounded text-red-200/80 text-xs overflow-x-auto custom-scrollbar select-text">
                                                            <pre className="whitespace-pre-wrap">{job.exceptionMessage}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm font-semibold tracking-wide">
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
