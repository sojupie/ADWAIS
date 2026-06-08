import { Play, Activity } from 'lucide-react';
import { useGlobalConfigQuery, useRecurringJobsQuery, useTriggerJobMutation, useBackfillMutation, useUpdateConfigMutation } from '../../hooks/useJobSettingsQueries';
import { useTenantsQuery } from '../../hooks/useTenantQueries';
import { RecurringJobsTable } from '../../components/settings/jobs/RecurringJobsTable';
import { ManualBackfillPanel } from '../../components/settings/jobs/ManualBackfillPanel';
import { SyncIntervalsForm } from '../../components/settings/jobs/SyncIntervalsForm';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';

export function BackgroundJobsView() {
    // Queries & Mutations from custom hooks
    const { data: config } = useGlobalConfigQuery();
    const { data: recurring } = useRecurringJobsQuery();
    const { data: tenants } = useTenantsQuery();

    const triggerJob = useTriggerJobMutation();
    const triggerBackfill = useBackfillMutation();
    const updateConfig = useUpdateConfigMutation();

    const manualJobs = [
        { id: 'monitor-sync', name: 'Monitor Sync', desc: 'Syncs monitor states from external providers.' },
        { id: 'uptime-sync', name: 'Uptime Sync', desc: 'Fetches latest uptime ping data.' },
        { id: 'latency-sync', name: 'Latency Sync', desc: 'Fetches latency metrics for all monitors.' },
        { id: 'user-stats-sync', name: 'User Stats', desc: 'Calculates active user statistics.' },
        { id: 'litium-sync', name: 'Litium Sync', desc: 'Synchronizes order data from Litium.' },
        { id: 'refresh-historic-order-data', name: 'Refresh Historic Orders', desc: 'Rebuilds materialized views for old orders.' },
        { id: 'refresh-monitoring-data', name: 'Refresh Monitoring', desc: 'Rebuilds monitoring materialized views.' },
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
                            {manualJobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => triggerJob.mutate(`/api/job/trigger/${job.id}`)}
                                    className="group flex flex-col text-left p-3 border border-slate-200 rounded-xl hover:border-brand-accent hover:shadow-md transition-all cursor-pointer relative overflow-hidden bg-slate-50/50 hover:bg-white"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Play size={14} className="text-brand-accent group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-bold text-slate-800">{job.name}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">{job.desc}</span>
                                </button>
                            ))}
                        </div>

                        <ManualBackfillPanel tenants={tenants} triggerBackfill={triggerBackfill} />
                        <SyncIntervalsForm config={config} updateConfig={updateConfig} />
                    </div>
                </div>
            </SettingsPanel>

            {/* Scheduled Jobs Section / Right Pane */}
            <RecurringJobsTable recurring={recurring} />
        </div>
    );
}
