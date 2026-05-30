import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Activity, Clock, Database, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../../apiClient';

import { InlineEditField } from '../../components/common/InlineEditField';

export const Route = createFileRoute('/settings/jobs')({
  component: BackgroundJobsView,
});

function BackgroundJobsView() {
  const queryClient = useQueryClient();
  const [backfill, setBackfill] = useState({ tenantId: '', startDate: '', endDate: '' });

  const { data: config } = useQuery({
    queryKey: ['global-config'],
    queryFn: () => apiFetch<any>('/api/global-config')
  });

  const { data: recurring } = useQuery({
    queryKey: ['job-recurring'],
    queryFn: () => apiFetch<any[]>('/api/job/recurring')
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => apiFetch<any[]>('/api/tenants')
  });

  const triggerJob = useMutation({
    mutationFn: (endpoint: string) => apiFetch(endpoint, { method: 'POST' }),
    onSuccess: () => alert('Job triggered successfully.')
  });

  const triggerBackfill = useMutation({
    mutationFn: (payload: any) => apiFetch('/api/Ingestion/backfill', {
      method: 'POST',
      body: JSON.stringify({ 
        tenantId: payload.tenantId, 
        startDate: payload.startDate ? new Date(payload.startDate).toISOString() : null, 
        endDate: payload.endDate ? new Date(payload.endDate).toISOString() : null 
      })
    }),
    onSuccess: () => {
      alert('Backfill initiated.');
      setBackfill({ tenantId: '', startDate: '', endDate: '' });
    }
  });

  const updateConfig = useMutation({
    mutationFn: (payload: any) => apiFetch('/api/global-config', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-config'] });
    }
  });



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
      <section className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-brand-bg-secondary border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 text-white rounded-lg shadow-sm">
                <Activity size={24} />
             </div>
             <div>
                <h2 className="text-lg font-extrabold text-white">Manual Triggers & Configuration</h2>
                <p className="text-xs font-semibold text-slate-300">Force execution & settings</p>
             </div>
          </div>
        </div>
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

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-btn-primary/10 text-brand-link rounded-lg">
                  <Database size={20} />
              </div>
              <div>
                  <h2 className="text-lg font-bold text-brand-text">Historical Backfill</h2>
                  <p className="text-sm font-medium text-slate-500">Force massive data ingestion</p>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <select 
                  value={backfill.tenantId} 
                  onChange={e => setBackfill({ ...backfill, tenantId: e.target.value })} 
                  className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg text-sm flex-1 focus:ring-2 focus:ring-brand-btn-primary focus:outline-none"
                >
                  <option value="" disabled>Select a tenant...</option>
                  {(tenants || []).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({(t.type === 1 ? 'Production' : 'Sandbox')})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Start Date</label>
                  <input 
                    type="datetime-local" 
                    value={backfill.startDate} 
                    onChange={e => setBackfill({ ...backfill, startDate: e.target.value })} 
                    className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-btn-primary focus:outline-none" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">End Date</label>
                  <input 
                    type="datetime-local" 
                    value={backfill.endDate} 
                    onChange={e => setBackfill({ ...backfill, endDate: e.target.value })} 
                    className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-btn-primary focus:outline-none" 
                  />
                </div>
              </div>
              <button 
                onClick={() => triggerBackfill.mutate(backfill)} 
                disabled={!backfill.tenantId}
                className="bg-brand-btn-primary hover:bg-brand-btn-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 mt-2 w-full"
              >
                <Play size={16} /> Execute Backfill
              </button>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 mt-1">
                <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">
                  Long backfills require multiple GET requests for pagination that are likely to get rate limited (although automatically managed by back-off and retry policies). <br />Triggering a backfill also drops existing materialized views. Expect performance degradation.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col break-inside-avoid">
           <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                  <Settings size={20} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-brand-text">Global Configuration</h2>
                  <p className="text-sm font-medium text-slate-500">System-wide parameters</p>
               </div>
             </div>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {config ? (
              <>
                <InlineEditField
                  label="Uptime Robot API Key"
                  value={config.uptimeRobotApiKey || ''}
                  type="password"
                  required
                  requiredCondition="if enabled"
                  onSave={(val) => updateConfig.mutate({ uptimeRobotApiKey: val })}
                />
                <InlineEditField
                  label="Litium Fetch Enabled"
                  value={config.litiumFetchEnabled ?? false}
                  type="checkbox"
                  onSave={(val) => updateConfig.mutate({ litiumFetchEnabled: val })}
                />
                <InlineEditField
                  label="Uptime Fetch Enabled"
                  value={config.uptimeRobotFetchEnabled ?? false}
                  type="checkbox"
                  onSave={(val) => updateConfig.mutate({ uptimeRobotFetchEnabled: val })}
                />
                <InlineEditField
                  label="Latency Floor (ms)"
                  value={config.latencyDegradedFloor ?? 0}
                  type="number"
                  onSave={(val) => updateConfig.mutate({ latencyDegradedFloor: val })}
                />
                <InlineEditField
                  label="Event Retention (Days)"
                  value={config.systemEventRetentionDays ?? 30}
                  type="number"
                  required
                  requiredCondition="> 0"
                  onSave={(val) => updateConfig.mutate({ systemEventRetentionDays: val })}
                />
              </>
            ) : (
              <div className="animate-pulse flex flex-col gap-4">
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      </section>

      {/* Scheduled Jobs Section / Right Pane */}
      <section className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-brand-bg-secondary border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 text-white rounded-lg shadow-sm">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Scheduled Jobs</h2>
              <p className="text-xs font-semibold text-slate-300">Recurring intervals</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Job ID</th>
                <th className="px-6 py-4">Cron</th>
                <th className="px-6 py-4">Queue</th>
                <th className="px-6 py-4">Last Execution</th>
                <th className="px-6 py-4">Next Execution</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recurring || []).map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{job.id}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-brand-accent/10 text-brand-text rounded text-xs font-mono font-bold tracking-widest">{job.cron}</span></td>
                  <td className="px-6 py-4 text-slate-500">{job.queue}</td>
                  <td className="px-6 py-4 text-slate-700 font-bold">{new Date(job.lastExecution).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(job.nextExecution).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {job.lastJobState === 'Succeeded' ? (
                      <span className="text-green-500 flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> Succeeded</span>
                    ) : (
                      <span className="text-orange-500 flex items-center gap-1.5 font-bold"><Activity size={14} /> {job.lastJobState || 'Pending'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
