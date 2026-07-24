import { Activity } from 'lucide-react';
import { useGlobalConfigQuery, useFetchIntervalsQuery, useUpdateConfigMutation, useUpdateFetchIntervalsMutation } from '../../hooks/useJobSettingsQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { GlobalConfigurationForm } from '../../components/settings/configuration/GlobalConfigurationForm';
import { FetchIntervalsForm } from '../../components/settings/configuration/FetchIntervalsForm';
import { CalendarSubscriptionsPanel } from '../../components/settings/configuration/CalendarSubscriptionsPanel';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';

export function ConfigurationView() {
    const { data: config } = useGlobalConfigQuery();
    const { data: intervals } = useFetchIntervalsQuery();
    const updateConfig = useUpdateConfigMutation();
    const updateIntervals = useUpdateFetchIntervalsMutation();
    const { role } = useCurrentUser();
    const disabled = role !== 'Admin';

    return (
        <div className="h-full min-h-0 w-full">
            <SettingsPanel>
                <SettingsPanelHeader
                    title="System Configuration"
                    subtitle="Control synchronization, feed and calendar behavior."
                    icon={<Activity size={24} />}
                />
                <div className="custom-scrollbar flex-1 overflow-y-auto p-3 sm:p-4">
                    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
                        <div className="flex flex-col gap-4">
                            <FetchIntervalsForm intervals={intervals} updateIntervals={updateIntervals} disabled={disabled} />
                            <CalendarSubscriptionsPanel disabled={disabled} />
                        </div>
                        <div className="flex flex-col gap-4">
                            <GlobalConfigurationForm config={config} updateConfig={updateConfig} disabled={disabled} />
                        </div>
                    </div>
                </div>
            </SettingsPanel>
        </div>
    );
}
