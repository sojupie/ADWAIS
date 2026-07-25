import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Activity, Plus, Edit2, Trash2 } from 'lucide-react';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SearchInput } from '../../components/common/ui/SearchInput';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';
import { useTenantsViewModel } from '../../hooks/useTenantsViewModel';
import { CreateMonitorModal } from '../../components/settings/tenants/CreateMonitorModal';
import { MonitorRow } from '../../components/settings/tenants/MonitorRow';
import { MonitorSettingsFilterMenu } from '../../components/settings/tenants/SettingsFilterMenu';

export function MonitorsView() {
    const navigate = useNavigate();
    const {
        isAdmin,
        allMonitors,
        filteredAndSortedMonitors,
        monitorSearch,
        setMonitorSearch,
        monitorFilters,
        setMonitorFilters,
        monitorSort,
        setMonitorSort,
        allUniqueTags,
        allUniqueTypes,
        createMonitor,
        deleteMonitor,
    } = useTenantsViewModel();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMonitorIds, setSelectedMonitorIds] = useState<Set<number>>(new Set());

    const handleSelect = (id: number) => {
        setSelectedMonitorIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDeleteSelected = () => {
        if (confirm(`Are you sure you want to delete ${selectedMonitorIds.size} monitor(s)?`)) {
            const ids = Array.from(selectedMonitorIds);
            ids.forEach(id => deleteMonitor.mutate(id));
            setSelectedMonitorIds(new Set());
        }
    };

    const handleEditSelected = () => {
        if (selectedMonitorIds.size === 1) {
            const id = selectedMonitorIds.values().next().value;
            if (id !== undefined) {
                void navigate({ to: '/settings/monitors/$monitorId', params: { monitorId: String(id) } });
            }
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full min-h-0">
            <SettingsPanel className="flex-1">
                <SettingsPanelHeader
                    title="Fleet Monitors"
                    subtitle="External availability and response-time checks."
                    icon={<Activity size={24} />}
                >
                    <SearchInput
                        value={monitorSearch}
                        onChange={setMonitorSearch}
                        placeholder="Search monitors..."
                    />

                    <MonitorSettingsFilterMenu
                        filters={monitorFilters}
                        setFilters={setMonitorFilters}
                        sort={monitorSort}
                        setSort={setMonitorSort}
                        tags={allUniqueTags}
                        types={allUniqueTypes}
                    />
                    
                    {isAdmin && (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-container px-5 text-sm font-bold text-on-secondary-container transition-colors hover:m3-elevation-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                            >
                                <Plus size={16} /> New
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSelected}
                                disabled={selectedMonitorIds.size !== 1}
                                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                disabled={selectedMonitorIds.size === 0}
                                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold text-error transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </>
                    )}
                </SettingsPanelHeader>

                <div className="custom-scrollbar flex-1 overflow-y-auto">
                    <div className="custom-scrollbar overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            <thead className="border-b border-outline-variant bg-surface-container text-on-surface-variant">
                                <tr>
                                    <th className="w-12 px-4 py-4 sm:px-5"></th>
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Monitor</th>
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">URL</th>
                                    <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Type</th>
                                    <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Assignment</th>
                                    <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {filteredAndSortedMonitors.map((m) => (
                                    <MonitorRow
                                        key={m.id}
                                        m={m}
                                        selected={m.id !== undefined ? selectedMonitorIds.has(m.id) : false}
                                        onSelect={() => isAdmin && m.id !== undefined && handleSelect(m.id)}
                                        onDoubleClick={() => isAdmin && m.id !== undefined && void navigate({ to: '/settings/monitors/$monitorId', params: { monitorId: String(m.id) } })}
                                    />
                                ))}
                                {allMonitors.length === 0 && (
                                    <EmptyState message="No monitors found" isTableRow colSpan={6} />
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </SettingsPanel>

            {isAdmin && (
                <CreateMonitorModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    createMonitor={createMonitor} 
                />
            )}
        </div>
    );
}
