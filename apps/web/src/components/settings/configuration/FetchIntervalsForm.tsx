import { Clock, Lock } from 'lucide-react';
import { SettingsPanel } from '../../common/layout/SettingsPanel';
import { InlineEditField } from '../../common/ui/InlineEditField';
import { FormSkeleton } from '../../common/ui/FormSkeleton';
import type { FetchIntervalsDto } from '../../../hooks/useJobSettingsQueries';

interface FetchIntervalsFormProps {
  intervals: FetchIntervalsDto | undefined;
  updateIntervals: {
    mutateAsync: (variables: Partial<FetchIntervalsDto>) => Promise<void>;
  };
  disabled?: boolean;
}

export function FetchIntervalsForm({ intervals, updateIntervals, disabled }: FetchIntervalsFormProps) {
  return (
    <SettingsPanel
      title="Fetch Intervals"
      subtitle="Job scheduling metrics"
      icon={<Clock size={24} />}
    >
      <div className="flex flex-col gap-4">
        {disabled && intervals && (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface-variant animate-in fade-in duration-300">
            <Lock size={16} className="shrink-0" aria-hidden="true" />
            <span>You can review these schedules, but only administrators can change them.</span>
          </div>
        )}

        {intervals ? (
          <div className="flex flex-col gap-2">
            <InlineEditField
              label="Litium Fetch Interval (mins)"
              value={intervals.litiumFetchIntervalMinutes}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateIntervals.mutateAsync({ litiumFetchIntervalMinutes: val })}
            />
            <InlineEditField
              label="Latency Fetch Interval (mins)"
              value={intervals.latencyFetchIntervalMinutes}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateIntervals.mutateAsync({ latencyFetchIntervalMinutes: val })}
            />
            <InlineEditField
              label="Uptime Fetch Interval (mins)"
              value={intervals.uptimeFetchIntervalMinutes}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateIntervals.mutateAsync({ uptimeFetchIntervalMinutes: val })}
            />
            <InlineEditField
              label="User Stats Fetch Interval (mins)"
              value={intervals.userStatsFetchIntervalMinutes}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateIntervals.mutateAsync({ userStatsFetchIntervalMinutes: val })}
            />
            <InlineEditField
              label="Feed Fetch Interval (hours)"
              value={intervals.feedFetchIntervalHours}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateIntervals.mutateAsync({ feedFetchIntervalHours: val })}
            />
          </div>
        ) : (
          <FormSkeleton>
            <FormSkeleton.Input labelWidth="w-48" />
            <FormSkeleton.Input labelWidth="w-48" />
            <FormSkeleton.Input labelWidth="w-48" />
            <FormSkeleton.Input labelWidth="w-56" />
            <FormSkeleton.Input labelWidth="w-48" />
          </FormSkeleton>
        )}
      </div>
    </SettingsPanel>
  );
}
