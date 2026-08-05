import { Settings } from 'lucide-react';
import { SettingsPanel } from '../../common/layout/SettingsPanel';
import { InlineEditField } from '../../common/ui/InlineEditField';
import { FormSkeleton } from '../../common/ui/FormSkeleton';
import { ReadOnlyBanner } from '../../common/ui/ReadOnlyBanner';
import type { GlobalConfigDto } from '@types';

interface GlobalConfigurationFormProps {
  config: GlobalConfigDto | undefined;
  updateConfig: {
    mutateAsync: (variables: Partial<GlobalConfigDto>) => Promise<void>;
  };
  disabled?: boolean;
}

export function GlobalConfigurationForm({ config, updateConfig, disabled }: GlobalConfigurationFormProps) {
  return (
    <SettingsPanel
      title="Global Configuration"
      subtitle="System-wide parameters"
      icon={<Settings size={24} />}
    >
      <div className="flex flex-col gap-4">
        {disabled && config && (
          <ReadOnlyBanner message="You can review these values, but only administrators can change them." />
        )}

        {config ? (
          <div className="flex flex-col gap-2">
            <InlineEditField
              label="Uptime Robot API Key"
              value={config.uptimeRobotApiKey || ''}
              kind="password"
              required
              requirement="When enabled"
              canClear
              disabled={disabled}
              onCommit={(val) => updateConfig.mutateAsync({ uptimeRobotApiKey: val })}
            />
            <InlineEditField
              label="Litium Fetch Enabled"
              value={config.litiumFetchEnabled ?? false}
              kind="checkbox"
              disabled={disabled}
              onCommit={(val) => updateConfig.mutateAsync({ litiumFetchEnabled: val })}
            />
            <InlineEditField
              label="Uptime Fetch Enabled"
              value={config.uptimeRobotFetchEnabled ?? false}
              kind="checkbox"
              disabled={disabled}
              onCommit={(val) => updateConfig.mutateAsync({ uptimeRobotFetchEnabled: val })}
            />
            <InlineEditField
              label="Event Retention (Days)"
              value={config.systemEventRetentionDays ?? 30}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateConfig.mutateAsync({ systemEventRetentionDays: val })}
            />
            <InlineEditField
              label="Reporting Timezone"
              value={config.reportingTimeZoneId || 'Europe/Stockholm'}
              kind="text"
              required
              requirement="Valid IANA identifier"
              placeholder="e.g. Europe/Stockholm"
              disabled={disabled}
              onCommit={(val) => updateConfig.mutateAsync({ reportingTimeZoneId: val })}
            />
            <InlineEditField
              label="Weather Location"
              value={config.weatherLocation || ''}
              kind="text"
              required
              requirement="Required for weather"
              placeholder="e.g. Stockholm, SE"
              disabled={disabled}
              onCommit={(val) => updateConfig.mutateAsync({ weatherLocation: val || null })}
            />
            <InlineEditField
              label="Weather Fetch Interval (Min)"
              value={config.weatherFetchIntervalMinutes ?? 15}
              kind="number"
              required
              requirement="Greater than 0"
              disabled={disabled}
              validate={val => val > 0 ? undefined : 'Enter a value greater than 0.'}
              onCommit={(val) => updateConfig.mutateAsync({ weatherFetchIntervalMinutes: val })}
            />
          </div>
        ) : (
          <FormSkeleton>
            <FormSkeleton.Input labelWidth="w-28" />
            <FormSkeleton.Checkbox textWidth="w-36" />
            <FormSkeleton.Checkbox textWidth="w-36" />
            <FormSkeleton.Input labelWidth="w-36" />
            <FormSkeleton.Input labelWidth="w-32" />
            <FormSkeleton.Input labelWidth="w-36" />
          </FormSkeleton>
        )}
      </div>
    </SettingsPanel>
  );
}
