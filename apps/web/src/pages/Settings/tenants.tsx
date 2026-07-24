import { Building2, Activity, Plus, X } from 'lucide-react';
import { TenantTile } from '../../components/settings/tenants/TenantTile';
import { MonitorTile } from '../../components/settings/tenants/MonitorTile';
import {
    MonitorSettingsFilterMenu,
    TenantSettingsFilterMenu,
} from '../../components/settings/tenants/SettingsFilterMenu';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SearchInput } from '../../components/common/ui/SearchInput';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Input } from '../../components/common/ui/Input';
import { Select } from '../../components/common/ui/Select';
import { useTenantsViewModel } from '../../hooks/useTenantsViewModel';
import { UPTIME_MONITOR_TYPES } from '../../utils/monitorTypeHelper';

export function TenantsMonitorsView() {
    const {
        isAdmin,
        tenants,
        allMonitors,
        allUniqueTags,
        sortedTenants,
        filteredAndSortedMonitors,
        assigningMonitorId,
        setAssigningMonitorId,
        assignTenantId,
        setAssignTenantId,
        isCreatingTenant,
        setIsCreatingTenant,
        newTenantDraft,
        setNewTenantDraft,
        isCreatingMonitor,
        setIsCreatingMonitor,
        newMonitorDraft,
        setNewMonitorDraft,
        tenantSort,
        setTenantSort,
        tenantSearch,
        setTenantSearch,
        tenantFilters,
        setTenantFilters,
        monitorSort,
        setMonitorSort,
        monitorSearch,
        setMonitorSearch,
        monitorFilters,
        setMonitorFilters,
        createTenant,
        deleteTenant,
        createMonitor,
        toggleMonitor,
        assignMonitor,
        unassignMonitor
    } = useTenantsViewModel();

    return (
        <div className="grid grid-cols-1 landscape-contained:grid-cols-2 portrait-contained:grid-rows-2 gap-4 h-full min-h-0">
            {/* Tenants Column */}
            <SettingsPanel>
                <SettingsPanelHeader
                    title="Tenants"
                    subtitle="Connected commerce environments and credentials."
                    icon={<Building2 size={24} />}
                >
                    <SearchInput
                        value={tenantSearch}
                        onChange={setTenantSearch}
                        placeholder="Search tenants..."
                    />
                    <TenantSettingsFilterMenu
                        filters={tenantFilters}
                        setFilters={setTenantFilters}
                        sort={tenantSort}
                        setSort={setTenantSort}
                    />
                    <SecureButton
                        onClick={() => setIsCreatingTenant(true)}
                        locked={!isAdmin}
                        lockTitle="Requires Admin privileges"
                        icon={<Plus size={16} className="shrink-0" />}
                        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                    >
                        New
                    </SecureButton>
                </SettingsPanelHeader>

                <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-4">
                    {isCreatingTenant && (
                        <div className="flex shrink-0 flex-col overflow-hidden rounded-xl bg-primary-container">
                            <div className="flex items-center justify-between gap-3 p-4">
                                <div>
                                    <h3 className="text-base font-black text-on-primary-container">Create tenant</h3>
                                    <p className="mt-1 text-sm font-medium text-on-primary-container">Connect a commerce environment to the dashboard.</p>
                                </div>
                                <button type="button" aria-label="Close tenant form" onClick={() => setIsCreatingTenant(false)} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-primary-container transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2">
                                <Input label="Name" placeholder="Tenant Name" value={newTenantDraft.name} onChange={e => setNewTenantDraft({ ...newTenantDraft, name: e.target.value })} />
                                <Input label="Litium Base URL" placeholder="https://example.com" value={newTenantDraft.litiumBaseUrl} onChange={e => setNewTenantDraft({ ...newTenantDraft, litiumBaseUrl: e.target.value })} />
                                <Input label="Image URL (optional)" placeholder="https://example.com/logo.png" value={newTenantDraft.imageUrl} onChange={e => setNewTenantDraft({ ...newTenantDraft, imageUrl: e.target.value })} />
                                <Input label="Service Account Token" type="password" className="font-mono" placeholder="Secret Token" value={newTenantDraft.serviceAccountToken} onChange={e => setNewTenantDraft({ ...newTenantDraft, serviceAccountToken: e.target.value })} />
                                <SecureButton
                                    className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary md:col-span-2 md:ml-auto"
                                    disabled={!newTenantDraft.name || !newTenantDraft.litiumBaseUrl}
                                    loading={createTenant.isPending}
                                    onClick={() => createTenant.mutate(newTenantDraft)}
                                >
                                    Create tenant
                                </SecureButton>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                        {sortedTenants.map((t) => (
                            <TenantTile
                                key={t.id}
                                t={t}
                                deleteTenant={deleteTenant}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>
                    {(!tenants || tenants.length === 0) && (
                        <EmptyState message="No tenants found" />
                    )}
                </div>
            </SettingsPanel>

            {/* Monitors Column */}
            <SettingsPanel>
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
                        tags={allUniqueTags}
                        sort={monitorSort}
                        setSort={setMonitorSort}
                    />
                    <SecureButton
                        onClick={() => setIsCreatingMonitor(true)}
                        locked={!isAdmin}
                        lockTitle="Requires Admin privileges"
                        icon={<Plus size={16} className="shrink-0" />}
                        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                    >
                        New
                    </SecureButton>
                </SettingsPanelHeader>

                <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-4">
                    {isCreatingMonitor && (
                        <div className="flex shrink-0 flex-col overflow-hidden rounded-xl bg-primary-container">
                            <div className="flex items-center justify-between gap-3 p-4">
                                <div>
                                    <h3 className="text-base font-black text-on-primary-container">Create monitor</h3>
                                    <p className="mt-1 text-sm font-medium text-on-primary-container">Add a new external availability check.</p>
                                </div>
                                <button type="button" aria-label="Close monitor form" onClick={() => setIsCreatingMonitor(false)} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-primary-container transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2">
                                <Input label="Name" placeholder="Monitor Name" value={newMonitorDraft.name} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, name: e.target.value })} />
                                <Input label="URL" placeholder="https://example.com" value={newMonitorDraft.url} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, url: e.target.value })} />
                                <Select label="Monitor Type" value={newMonitorDraft.type} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, type: e.target.value })}>
                                    {UPTIME_MONITOR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </Select>
                                <Input label="Uptime SLA (%)" type="number" step="0.1" value={newMonitorDraft.uptimeSla} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, uptimeSla: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="e.g. 99.9" />
                                <SecureButton
                                    className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary md:col-span-2 md:ml-auto"
                                    disabled={!newMonitorDraft.name || !newMonitorDraft.url}
                                    loading={createMonitor.isPending}
                                    onClick={() => createMonitor.mutate({
                                        name: newMonitorDraft.name,
                                        url: newMonitorDraft.url,
                                        type: newMonitorDraft.type,
                                        uptimeSla: newMonitorDraft.uptimeSla === '' ? null : newMonitorDraft.uptimeSla
                                    })}
                                >
                                    Create monitor
                                </SecureButton>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                        {filteredAndSortedMonitors.map((m) => (
                            <MonitorTile
                                key={m.id}
                                m={m}
                                toggleMonitor={toggleMonitor}
                                assignMonitor={assignMonitor}
                                unassignMonitor={unassignMonitor}
                                tenants={tenants}
                                isAssigning={assigningMonitorId === m.id}
                                setAssigningMonitorId={setAssigningMonitorId}
                                assignTenantId={assignTenantId}
                                setAssignTenantId={setAssignTenantId}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>
                    {allMonitors.length === 0 && (
                        <EmptyState message="No monitors found" />
                    )}
                </div>
            </SettingsPanel>
        </div>
    );
}
