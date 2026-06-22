import { Activity } from 'lucide-react';
import { useGlobalConfigQuery, useFetchIntervalsQuery, useUpdateConfigMutation, useUpdateFetchIntervalsMutation } from '../../hooks/useJobSettingsQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { GlobalConfigurationForm } from '../../components/settings/configuration/GlobalConfigurationForm';
import { FetchIntervalsForm } from '../../components/settings/configuration/FetchIntervalsForm';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SectionHeader } from '../../components/common/layout/SectionHeader';

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
                <SectionHeader
                    title="System Configuration"
                    subtitle="Global settings and intervals"
                    icon={<Activity size={24} />}
                />
                <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 custom-scrollbar bg-white rounded-xl shadow-sm border border-slate-200/60">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <GlobalConfigurationForm config={config} updateConfig={updateConfig} disabled={disabled} />
                        <FetchIntervalsForm intervals={intervals} updateIntervals={updateIntervals} disabled={disabled} />
                    </div>
                </div>
            </SettingsPanel>
        </div>
    );
}
