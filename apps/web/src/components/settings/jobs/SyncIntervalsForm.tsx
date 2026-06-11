import { Settings } from 'lucide-react';
import { SettingsCard } from '../../common/layout/SettingsCard';
import { InlineEditField } from '../../common/ui/InlineEditField';
import type { GlobalConfigDto } from '@types';

interface SyncIntervalsFormProps {
  config: (GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number | null; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }) | undefined;
  updateConfig: {
    mutate: (variables: Partial<GlobalConfigDto & { uptimeRobotApiKey?: string; latencyDegradedFloor?: number | null; systemEventRetentionDays?: number; uptimeRobotFetchEnabled?: boolean }>) => void;
  };
}

export function SyncIntervalsForm({ config, updateConfig }: SyncIntervalsFormProps) {
  return (
    <SettingsCard
      title="Global Configuration"
      subtitle="System-wide parameters"
      icon={<Settings size={20} />}
    >
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
            value={config.latencyDegradedFloor !== null && config.latencyDegradedFloor !== undefined ? config.latencyDegradedFloor : null}
            type="number"
            placeholder="e.g. 150"
            onSave={(val) => updateConfig.mutate({ latencyDegradedFloor: val })}
          />
          <InlineEditField
            label="Default Uptime SLA (%)"
            value={config.defaultUptimeSla !== null && config.defaultUptimeSla !== undefined ? config.defaultUptimeSla : null}
            type="number"
            placeholder="e.g. 99.9"
            onSave={(val) => updateConfig.mutate({ defaultUptimeSla: val })}
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
    </SettingsCard>
  );
}
