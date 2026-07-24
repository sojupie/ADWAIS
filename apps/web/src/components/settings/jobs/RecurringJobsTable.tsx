import { CheckCircle2, Activity } from 'lucide-react';
import { EmptyState } from '../../common/ui/EmptyState';
import { Skeleton } from '../../common/ui/Skeleton';
import type { RecurringJobDto } from '@types';
import { formatDateTime } from '../../../utils/dateTime';

interface RecurringJobsTableProps {
  recurring: RecurringJobDto[] | undefined;
}

export function RecurringJobsTable({ recurring }: RecurringJobsTableProps) {
  return (
    <div className="custom-scrollbar h-full w-full overflow-auto text-left text-sm">
      <table className="w-full min-w-[720px]">
        <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_0_var(--md-sys-color-outline)] text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          <tr>
            <th className="px-3 py-2">Job ID</th>
            <th className="px-3 py-2">Cron</th>
            <th className="px-3 py-2">Last Execution</th>
            <th className="px-3 py-2">Next Execution</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
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
              <tr key={job.id} className="transition-colors bg-surface-container-low hover:bg-surface-container">
                <td className="px-3 py-2 font-bold text-on-surface break-words max-w-[150px]">{job.id}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="px-1 py-0.5 bg-brand-accent/10 text-brand-text rounded text-xs font-mono font-bold tracking-widest break-words max-w-[100px] inline-block">
                    {job.cron}
                  </span>
                </td>
                <td className="px-3 py-2 text-on-surface-variant font-bold whitespace-nowrap">
                  {formatDateTime(job.lastExecution, {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                  }) || 'Never'}
                </td>
                <td className="px-3 py-2 text-on-surface-variant whitespace-nowrap">
                  {formatDateTime(job.nextExecution, {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                  }) || 'Never'}
                </td>
                <td className="px-3 py-2">
                  {job.lastJobState === 'Succeeded' ? (
                    <span className="text-green-500 flex items-center gap-3 font-bold"><CheckCircle2 size={14} /> Succeeded</span>
                  ) : (
                    <span className="text-orange-500 flex items-center gap-3 font-bold"><Activity size={14} /> {job.lastJobState || 'Pending'}</span>
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
