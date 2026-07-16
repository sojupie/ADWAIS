import { Clock, Lock } from 'lucide-react';
import { SettingsCard } from '../../common/layout/SettingsCard';
import { InlineEditField } from '../../common/ui/InlineEditField';
import { FormSkeleton } from '../../common/ui/FormSkeleton';
import type { FetchIntervalsDto } from '../../../hooks/useJobSettingsQueries';

interface FetchIntervalsFormProps {
  intervals: FetchIntervalsDto | undefined;
  updateIntervals: {
    mutate: (variables: Partial<FetchIntervalsDto>) => void;
  };
  disabled?: boolean;
}

export function FetchIntervalsForm({ intervals, updateIntervals, disabled }: FetchIntervalsFormProps) {
  return (
    <SettingsCard
      title="Fetch Intervals"
      subtitle="Job scheduling metrics"
      icon={<Clock size={20} />}
    >
      {disabled && intervals && (
        <div className="mb-4 p-3 bg-surface-container border border-outline-variant rounded-xl flex items-center gap-4 text-sm text-slate-650 font-bold uppercase tracking-wider animate-in fade-in duration-300">
          <Lock size={14} className="text-on-surface-variant shrink-0" />
          <span>Read-only configuration view</span>
        </div>
      )}

      {intervals ? (
        <div className="flex flex-col gap-2">
          <InlineEditField
            label="Litium Fetch Interval (mins)"
            value={intervals.litiumFetchIntervalMinutes}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateIntervals.mutate({ litiumFetchIntervalMinutes: val })}
          />
          <InlineEditField
            label="Latency Fetch Interval (mins)"
            value={intervals.latencyFetchIntervalMinutes}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateIntervals.mutate({ latencyFetchIntervalMinutes: val })}
          />
          <InlineEditField
            label="Uptime Fetch Interval (mins)"
            value={intervals.uptimeFetchIntervalMinutes}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateIntervals.mutate({ uptimeFetchIntervalMinutes: val })}
          />
          <InlineEditField
            label="User Stats Fetch Interval (mins)"
            value={intervals.userStatsFetchIntervalMinutes}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateIntervals.mutate({ userStatsFetchIntervalMinutes: val })}
          />
          <InlineEditField
            label="Feed Fetch Interval (hours)"
            value={intervals.feedFetchIntervalHours}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateIntervals.mutate({ feedFetchIntervalHours: val })}
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
    </SettingsCard>
  );
}
