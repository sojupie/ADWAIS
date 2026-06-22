import { Building2, Activity, Plus, X } from 'lucide-react';
import { TenantTile } from '../../components/settings/tenants/TenantTile';
import { MonitorTile } from '../../components/settings/tenants/MonitorTile';
import { TenantFilterMenu } from '../../components/settings/tenants/TenantFilterMenu';
import { MonitorFilterMenu } from '../../components/settings/tenants/MonitorFilterMenu';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SearchInput } from '../../components/common/ui/SearchInput';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Input } from '../../components/common/ui/Input';
import { Select } from '../../components/common/ui/Select';
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
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
                    <TenantFilterMenu filters={tenantFilters} setFilters={setTenantFilters} />
                    <Select
                        value={tenantSort}
                        onChange={e => setTenantSort(e.target.value as 'asc' | 'desc')}
                        containerClassName="w-auto shrink-0"
                        className="text-sm font-semibold pl-3 pr-8 py-1.5 text-slate-700 hover:bg-slate-50 focus:ring-2 h-9 rounded-lg border-slate-200"
                    >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                    </Select>
                    <SecureButton
                        onClick={() => setIsCreatingTenant(true)}
                        locked={!isAdmin}
                        lockTitle="Requires Admin privileges"
                        icon={<Plus size={16} className="shrink-0" />}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm shrink-0 bg-brand-link text-white hover:bg-brand-link/90 cursor-pointer animate-in fade-in duration-200"
                    >
                        New
                    </SecureButton>
                </SectionHeader>

                <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 flex flex-col gap-4 custom-scrollbar bg-white rounded-xl shadow-sm border border-slate-200/60">
                    {isCreatingTenant && (
                        <div className="border-2 border-brand-link/20 rounded-xl overflow-hidden bg-brand-link/5 shadow-sm shrink-0 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-brand-link/10">
                                <span className="font-extrabold text-brand-link text-sm">Create New Tenant</span>
                                <button onClick={() => setIsCreatingTenant(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                <Input label="Name" placeholder="Tenant Name" value={newTenantDraft.name} onChange={e => setNewTenantDraft({ ...newTenantDraft, name: e.target.value })} />
                                <Input label="Litium Base URL" placeholder="https://example.com" value={newTenantDraft.litiumBaseUrl} onChange={e => setNewTenantDraft({ ...newTenantDraft, litiumBaseUrl: e.target.value })} />
                                <Input label="Service Account Token" type="password" className="font-mono" placeholder="Secret Token" value={newTenantDraft.serviceAccountToken} onChange={e => setNewTenantDraft({ ...newTenantDraft, serviceAccountToken: e.target.value })} />
                                <SecureButton
                                    className="mt-2 bg-brand-link hover:bg-brand-link/90 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 w-full"
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
                    <MonitorFilterMenu
                        filters={monitorFilters}
                        setFilters={setMonitorFilters}
                        tags={allUniqueTags}
                    />
                    <Select
                        value={monitorSort}
                        onChange={e => setMonitorSort(e.target.value as 'asc' | 'desc')}
                        containerClassName="w-auto shrink-0"
                        className="text-sm font-semibold pl-3 pr-8 py-1.5 text-slate-700 hover:bg-slate-50 focus:ring-2 h-9 rounded-lg border-slate-200"
                    >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                    </Select>
                    <SecureButton
                        onClick={() => setIsCreatingMonitor(true)}
                        locked={!isAdmin}
                        lockTitle="Requires Admin privileges"
                        icon={<Plus size={16} className="shrink-0" />}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm shrink-0 bg-brand-link text-white hover:bg-brand-link/90 cursor-pointer animate-in fade-in duration-200"
                    >
                        New
                    </SecureButton>
                </SectionHeader>

                <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 flex flex-col gap-4 custom-scrollbar bg-white rounded-xl shadow-sm border border-slate-200/60">
                    {isCreatingMonitor && (
                        <div className="border-2 border-brand-link/20 rounded-xl overflow-hidden bg-brand-link/5 shadow-sm shrink-0 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-brand-link/10">
                                <span className="font-extrabold text-brand-link text-sm">Create New Monitor</span>
                                <button onClick={() => setIsCreatingMonitor(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                <Input label="Name" placeholder="Monitor Name" value={newMonitorDraft.name} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, name: e.target.value })} />
                                <Input label="URL" placeholder="https://example.com" value={newMonitorDraft.url} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, url: e.target.value })} />
                                <Input label="Uptime SLA (%)" type="number" step="0.1" value={newMonitorDraft.uptimeSla} onChange={e => setNewMonitorDraft({ ...newMonitorDraft, uptimeSla: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="e.g. 99.9" />
                                <SecureButton
                                    className="mt-2 bg-brand-link hover:bg-brand-link/90 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 w-full"
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