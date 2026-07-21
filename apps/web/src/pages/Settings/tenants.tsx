import { Building2, Activity, Plus, X } from 'lucide-react';
import { TenantTile } from '../../components/settings/tenants/TenantTile';
import { MonitorTile } from '../../components/settings/tenants/MonitorTile';
import {
    MonitorSettingsFilterMenu,
    TenantSettingsFilterMenu,
} from '../../components/settings/tenants/SettingsFilterMenu';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SearchInput } from '../../components/common/ui/SearchInput';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Input } from '../../components/common/ui/Input';
import { useTenantsViewModel } from '../../hooks/useTenantsViewModel';

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
                <SectionHeader
                    title="Tenants"
                    subtitle="Manage your environments"
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
                        className="flex items-center gap-2 px-3 py-1.5 h-9 rounded-lg text-sm font-bold transition-colors shadow-sm shrink-0 bg-brand-link text-white hover:bg-brand-link/90 cursor-pointer"
                    >
                        New
                    </SecureButton>
                </SectionHeader>

                <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 flex flex-col gap-4 custom-scrollbar bg-surface rounded-xl shadow-sm border border-outline-variant/60">
                    {isCreatingTenant && (
                        <div className="border-2 border-brand-link/20 rounded-xl overflow-hidden bg-brand-link/5 shadow-sm shrink-0 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-brand-link/10">
                                <span className="font-extrabold text-on-surface text-sm">Create New Tenant</span>
                                <button onClick={() => setIsCreatingTenant(false)} className="text-on-surface-variant hover:text-on-surface-variant cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                <Input label="Name" placeholder="Tenant Name" value={newTenantDraft.name} onChange={e => setNewTenantDraft({ ...newTenantDraft, name: e.target.value })} />
                                <Input label="Litium Base URL" placeholder="https://example.com" value={newTenantDraft.litiumBaseUrl} onChange={e => setNewTenantDraft({ ...newTenantDraft, litiumBaseUrl: e.target.value })} />
                                <Input label="Service Account Token" type="password" className="font-mono" placeholder="Secret Token" value={newTenantDraft.serviceAccountToken} onChange={e => setNewTenantDraft({ ...newTenantDraft, serviceAccountToken: e.target.value })} />
                                <SecureButton
                                    className="mt-2 bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-4 w-full"
                                    disabled={!newTenantDraft.name || !newTenantDraft.litiumBaseUrl}
                                    loading={createTenant.isPending}
                                    onClick={() => createTenant.mutate(newTenantDraft)}
                                >
                                    Save Tenant
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
                <SectionHeader
                    title="Fleet Monitors"
                    subtitle="Manage external health checks"
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
                        className="flex items-center gap-2 px-3 py-1.5 h-9 rounded-lg text-sm font-bold transition-colors shadow-sm shrink-0 bg-brand-link text-white hover:bg-brand-link/90 cursor-pointer"
                    >
                        New
                    </SecureButton>
                </SectionHeader>

                <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 flex flex-col gap-4 custom-scrollbar bg-surface rounded-xl shadow-sm border border-outline-variant/60">
                    {isCreatingMonitor && (
                        <div className="border-2 border-brand-link/20 rounded-xl overflow-hidden bg-brand-link/5 shadow-sm shrink-0 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-brand-link/10">
                                <span className="font-extrabold text-on-surface-variant text-sm">Create New Monitor</span>
                                <button onClick={() => setIsCreatingMonitor(false)} className="text-on-surface-variant hover:text-on-surface-variant cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                <Input label="Name" placeholder="Monitor Name" value={newMonitorDraft.name} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, name: e.target.value })} />
                                <Input label="URL" placeholder="https://example.com" value={newMonitorDraft.url} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, url: e.target.value })} />
                                <Input label="Uptime SLA (%)" type="number" step="0.1" value={newMonitorDraft.uptimeSla} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, uptimeSla: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="e.g. 99.9" />
                                <SecureButton
                                    className="mt-2 bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-4 w-full"
                                    disabled={!newMonitorDraft.name || !newMonitorDraft.url}
                                    loading={createMonitor.isPending}
                                    onClick={() => createMonitor.mutate({
                                        name: newMonitorDraft.name,
                                        url: newMonitorDraft.url,
                                        uptimeSla: newMonitorDraft.uptimeSla === '' ? null : newMonitorDraft.uptimeSla
                                    })}
                                >
                                    Save Monitor
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
