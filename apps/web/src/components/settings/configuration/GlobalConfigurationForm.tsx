import { Settings, Lock } from 'lucide-react';
import { SettingsCard } from '../../common/layout/SettingsCard';
import { InlineEditField } from '../../common/ui/InlineEditField';
import { FormSkeleton } from '../../common/ui/FormSkeleton';
import type { GlobalConfigDto } from '@types';

interface GlobalConfigurationFormProps {
  config: GlobalConfigDto | undefined;
  updateConfig: {
    mutate: (variables: Partial<GlobalConfigDto>) => void;
  };
  disabled?: boolean;
}

export function GlobalConfigurationForm({ config, updateConfig, disabled }: GlobalConfigurationFormProps) {
  return (
    <SettingsCard
      title="Global Configuration"
      subtitle="System-wide parameters"
      icon={<Settings size={20} />}
    >
      {disabled && config && (
        <div className="mb-4 p-3 bg-surface-container border border-outline-variant rounded-xl flex items-center gap-4 text-sm text-slate-650 font-bold uppercase tracking-wider animate-in fade-in duration-300">
          <Lock size={14} className="text-on-surface-variant shrink-0" />
          <span>Read-only configuration view</span>
        </div>
      )}

      {config ? (
        <div className="flex flex-col gap-2">
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
          <InlineEditField
            label="Reporting Timezone"
            value={config.reportingTimeZoneId || 'Europe/Stockholm'}
            type="text"
            required
            requiredCondition="Valid IANA timezone identifier"
            placeholder="e.g. Europe/Stockholm"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ reportingTimeZoneId: val })}
          />
          <InlineEditField
            label="Weather Location"
            value={config.weatherLocation || ''}
            type="text"
            required
            requiredCondition="Must not be empty to display weather"
            placeholder="e.g. Stockholm, SE"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ weatherLocation: val || null })}
          />
          <InlineEditField
            label="Weather Fetch Interval (Min)"
            value={config.weatherFetchIntervalMinutes ?? 15}
            type="number"
            required
            requiredCondition="> 0"
            disabled={disabled}
            onSave={(val) => updateConfig.mutate({ weatherFetchIntervalMinutes: val })}
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
          <FormSkeleton.Input labelWidth="w-32" />
          <FormSkeleton.Input labelWidth="w-36" />
        </FormSkeleton>
      )}
    </SettingsCard>
  );
}
