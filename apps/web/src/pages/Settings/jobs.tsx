import { Play, Activity, Lock } from 'lucide-react';
import { useGlobalConfigQuery, useRecurringJobsQuery, useTriggerJobMutation, useBackfillMutation, useUpdateConfigMutation } from '../../hooks/useJobSettingsQueries';
import { useTenantsQuery } from '../../hooks/useTenantQueries';
import { RecurringJobsTable } from '../../components/settings/jobs/RecurringJobsTable';
import { ManualBackfillPanel } from '../../components/settings/jobs/ManualBackfillPanel';
import { SyncIntervalsForm } from '../../components/settings/jobs/SyncIntervalsForm';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export function BackgroundJobsView() {
    // Queries & Mutations from custom hooks
    const { data: config } = useGlobalConfigQuery();
    const { data: recurring } = useRecurringJobsQuery();
    const { data: tenants } = useTenantsQuery();
    const { role } = useCurrentUser();

    const triggerJob = useTriggerJobMutation();
    const triggerBackfill = useBackfillMutation();
    const updateConfig = useUpdateConfigMutation();

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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:col-span-2">
                            {manualJobs.map(job => {
                                const isRestricted = job.isAdminOnly && role !== 'Admin';
                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => !isRestricted && triggerJob.mutate(`/api/job/trigger/${job.id}`)}
                                        disabled={isRestricted}
                                        className={`group flex flex-col text-left p-3 border rounded-xl transition-all relative overflow-hidden bg-slate-50/50 ${
                                            isRestricted 
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
                        <SyncIntervalsForm config={config} updateConfig={updateConfig} disabled={role !== 'Admin'} />
                    </div>
                </div>
            </SettingsPanel>

            {/* Scheduled Jobs Section / Right Pane */}
            <RecurringJobsTable recurring={recurring} />
        </div>
    );
}
