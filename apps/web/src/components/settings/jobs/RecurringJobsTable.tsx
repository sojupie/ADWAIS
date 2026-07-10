import { CheckCircle2, Activity } from 'lucide-react';
import { EmptyState } from '../../common/ui/EmptyState';
import { Skeleton } from '../../common/ui/Skeleton';
import type { RecurringJobDto } from '@types';

interface RecurringJobsTableProps {
  recurring: RecurringJobDto[] | undefined;
}

export function RecurringJobsTable({ recurring }: RecurringJobsTableProps) {
  return (
    <div className="w-full text-left text-sm overflow-x-auto">
      <table className="w-full">
        <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-semibold uppercase text-xs">
          <tr>
            <th className="px-3 py-2">Job ID</th>
            <th className="px-3 py-2">Cron</th>
            <th className="px-3 py-2">Last Execution</th>
            <th className="px-3 py-2">Next Execution</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {recurring === undefined ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2"><Skeleton className="h-4 w-28" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-32" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-32" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-20" /></td>
              </tr>
            ))
          ) : (
            recurring.map((job) => (
              <tr key={job.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="px-3 py-2 font-bold text-on-surface break-words max-w-[150px]">{job.id}</td>
                <td className="px-3 py-2">
                  <span className="px-1 py-0.5 bg-brand-accent/10 text-brand-text rounded text-xs font-mono font-bold tracking-widest break-words max-w-[100px] inline-block">
                    {job.cron}
                  </span>
                </td>
                <td className="px-3 py-2 text-on-surface-variant font-bold whitespace-nowrap">
                  {job.lastExecution ? new Date(job.lastExecution).toLocaleString() : 'Never'}
                </td>
                <td className="px-3 py-2 text-on-surface-variant whitespace-nowrap">
                  {job.nextExecution ? new Date(job.nextExecution).toLocaleString() : 'Never'}
                </td>
                <td className="px-3 py-2">
                  {job.lastJobState === 'Succeeded' ? (
                    <span className="text-green-500 flex items-center gap-1.5 font-bold"><CheckCircle2 size={14} /> Succeeded</span>
                  ) : (
                    <span className="text-orange-500 flex items-center gap-1.5 font-bold"><Activity size={14} /> {job.lastJobState || 'Pending'}</span>
                  )}
                </td>
              </tr>
            ))
          )}
          {recurring !== undefined && recurring.length === 0 && (
            <EmptyState message="No recurring jobs configured." isTableRow colSpan={5} />
          )}
        </tbody>
      </table>
    </div>
  );
}
