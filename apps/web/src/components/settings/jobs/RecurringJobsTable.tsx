import { Clock, CheckCircle2, Activity } from 'lucide-react';
import { SectionHeader } from '../../common/layout/SectionHeader';
import { SettingsPanel } from '../../common/layout/SettingsPanel';
import { EmptyState } from '../../common/ui/EmptyState';
import type { RecurringJobDto } from '@types';

interface RecurringJobsTableProps {
  recurring: RecurringJobDto[] | undefined;
}

export function RecurringJobsTable({ recurring }: RecurringJobsTableProps) {
  return (
    <SettingsPanel>
      <SectionHeader
        title="Scheduled Jobs"
        subtitle="Recurring intervals"
        icon={<Clock size={24} />}
      />
      
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        <div className="overflow-x-auto">
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
              {(recurring || []).map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{job.id}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-text rounded text-xs font-mono font-bold tracking-widest">
                      {job.cron}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{(job as RecurringJobDto & { queue?: string }).queue || 'default'}</td>
                  <td className="px-6 py-4 text-slate-700 font-bold">
                    {job.lastExecution ? new Date(job.lastExecution).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {job.nextExecution ? new Date(job.nextExecution).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    {job.lastJobState === 'Succeeded' ? (
                      <span className="text-green-500 flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> Succeeded</span>
                    ) : (
                      <span className="text-orange-500 flex items-center gap-1.5 font-bold"><Activity size={14} /> {job.lastJobState || 'Pending'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!recurring || recurring.length === 0) && (
                <EmptyState message="No recurring jobs configured." isTableRow colSpan={6} />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsPanel>
  );
}
