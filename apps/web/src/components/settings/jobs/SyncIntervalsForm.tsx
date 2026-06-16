import { Settings, Lock } from 'lucide-react';
import { SettingsCard } from '../../common/layout/SettingsCard';
import { InlineEditField } from '../../common/ui/InlineEditField';
import { FormSkeleton } from '../../common/ui/FormSkeleton';
import type { GlobalConfigDto } from '@types';

interface SyncIntervalsFormProps {
  config: (GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number | null; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }) | undefined;
  updateConfig: {
    mutate: (variables: Partial<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number | null; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>) => void;
  };
  disabled?: boolean;
}

export function SyncIntervalsForm({ config, updateConfig, disabled }: SyncIntervalsFormProps) {
  return (
    <SettingsCard
      title="Global Configuration"
      subtitle="System-wide parameters"
      icon={<Settings size={20} />}
    >
      {disabled && config && (
        <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-650 font-bold uppercase tracking-wider animate-in fade-in duration-300">
          <Lock size={14} className="text-slate-500 shrink-0" />
          <span>Read-only configuration view</span>
        </div>
      )}

      {config ? (
        <div className="flex flex-col gap-1">
          <InlineEditField
            label="Uptime Robot API Key"
            value={config.uptimeRobotApiKey || ''}
            type="password"
            required
            requiredCondition="if enabled"
            allowClear
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ uptimeRobotApiKey: val })}
          />
          <InlineEditField
            label="Litium Fetch Enabled"
            value={config.litiumFetchEnabled ?? false}
            type="checkbox"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ litiumFetchEnabled: val })}
          />
          <InlineEditField
            label="Uptime Fetch Enabled"
            value={config.uptimeRobotFetchEnabled ?? false}
            type="checkbox"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ uptimeRobotFetchEnabled: val })}
          />
          <InlineEditField
            label="Latency Floor (ms)"
            value={config.latencyDegradedFloor !== null && config.latencyDegradedFloor !== undefined ? config.latencyDegradedFloor : null}
            type="number"
            placeholder="e.g. 150"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ latencyDegradedFloor: val })}
          />
          <InlineEditField
            label="Default Uptime SLA (%)"
            value={config.defaultUptimeSla !== null && config.defaultUptimeSla !== undefined ? config.defaultUptimeSla : null}
            type="number"
            placeholder="e.g. 99.9"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ defaultUptimeSla: val })}
          />
          <InlineEditField
            label="Event Retention (Days)"
            value={config.systemEventRetentionDays ?? 30}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ systemEventRetentionDays: val })}
          />
        </div>
      ) : (
        <FormSkeleton>
          <FormSkeleton.Input labelWidth="w-28" />
          <FormSkeleton.Checkbox textWidth="w-36" />
          <FormSkeleton.Checkbox textWidth="w-36" />
          <FormSkeleton.Input labelWidth="w-32" />
          <FormSkeleton.Input labelWidth="w-40" />
          <FormSkeleton.Input labelWidth="w-36" />
        </FormSkeleton>
      )}
    </SettingsCard>
  );
}
