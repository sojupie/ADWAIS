import { Building2, Activity, Plus, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTenantsQuery, useCreateTenantMutation, useDeleteTenantMutation } from '../../hooks/useTenantQueries';
import { useMonitorsQuery, useUnassignedMonitorsQuery, useCreateMonitorMutation, useControlMonitorMutation, useAssignMonitorMutation, useUnassignMonitorMutation } from '../../hooks/useMonitorQueries';
import { TenantTile } from '../../components/settings/tenants/TenantTile';
import { MonitorTile } from '../../components/settings/tenants/MonitorTile';
import { TenantFilterMenu } from '../../components/settings/tenants/TenantFilterMenu';
import { MonitorFilterMenu } from '../../components/settings/tenants/MonitorFilterMenu';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SearchInput } from '../../components/common/ui/SearchInput';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';
import type { UptimeMonitorDto } from '@types';

export function TenantsMonitorsView() {
    const [assigningMonitorId, setAssigningMonitorId] = useState<number | null>(null);
    const [assignTenantId, setAssignTenantId] = useState('');

    const [isCreatingTenant, setIsCreatingTenant] = useState(false);
    const [newTenantDraft, setNewTenantDraft] = useState({ name: '', litiumBaseUrl: '', serviceAccountToken: '' });

    const [isCreatingMonitor, setIsCreatingMonitor] = useState(false);
    const [newMonitorDraft, setNewMonitorDraft] = useState<{ name: string; url: string; uptimeSla: number | '' }>({ name: '', url: '', uptimeSla: '' });

    const [tenantSort, setTenantSort] = useState<'asc' | 'desc'>('asc');
    const [tenantSearch, setTenantSearch] = useState('');
    const [tenantFilters, setTenantFilters] = useState({ token: 'all', fetch: 'all' });

    const [monitorSort, setMonitorSort] = useState<'asc' | 'desc'>('asc');
    const [monitorSearch, setMonitorSearch] = useState('');
    const [monitorFilters, setMonitorFilters] = useState<{ assignment: 'all' | 'assigned' | 'unassigned'; tag: string }>({ assignment: 'all', tag: 'all' });

    // Queries & Mutations from custom hooks
    const { data: tenants } = useTenantsQuery();
    const { data: monitors } = useMonitorsQuery();
    const { data: unassignedMonitors } = useUnassignedMonitorsQuery();

    const createTenant = useCreateTenantMutation(() => {
        setIsCreatingTenant(false);
        setNewTenantDraft({ name: '', litiumBaseUrl: '', serviceAccountToken: '' });
    });
    const deleteTenant = useDeleteTenantMutation();

    const createMonitor = useCreateMonitorMutation(() => {
        setIsCreatingMonitor(false);
        setNewMonitorDraft({ name: '', url: '', uptimeSla: '' });
    });
    const toggleMonitor = useControlMonitorMutation();
    const assignMonitor = useAssignMonitorMutation(() => {
        setAssigningMonitorId(null);
        setAssignTenantId('');
    });
    const unassignMonitor = useUnassignMonitorMutation();

    const allMonitors = [...(monitors || []), ...(unassignedMonitors || [])].reduce((acc, curr) => {
        if (!acc.find((m) => m.id === curr.id)) {
            acc.push(curr);
        }
        return acc;
    }, [] as UptimeMonitorDto[]);

    const allUniqueTags = useMemo(() => {
        const tagsSet = new Set<string>();
        allMonitors.forEach((m) => {
            if (m.tags && Array.isArray(m.tags)) {
                m.tags.forEach((t) => {
                    const trimmed = t.trim().toUpperCase();
                    if (trimmed) {
                        tagsSet.add(trimmed);
                    }
                });
            }
        });
        return Array.from(tagsSet).sort();
    }, [allMonitors]);

    const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

    // Filter & Sort Tenants
    const sortedTenants = [...(tenants || [])].filter((t) => {
        if (t.id === SYSTEM_TENANT_ID) return false;
        if (tenantSearch) {
            const q = tenantSearch.toLowerCase();
            const matchName = t.name?.toLowerCase().includes(q);
            const matchUrl = t.litiumBaseUrl?.toLowerCase().includes(q);
            if (!matchName && !matchUrl) return false;
        }
        const hasToken = t.hasServiceAccountToken;
        if (tenantFilters.token === 'set') if (!hasToken) return false;
        if (tenantFilters.token === 'missing') if (hasToken) return false;
        if (tenantFilters.fetch === 'on') if (!t.orderFetchingEnabled) return false;
        if (tenantFilters.fetch === 'off') if (t.orderFetchingEnabled) return false;
        return true;
    }).sort((a, b) => {
        return tenantSort === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    // Filter & Sort Monitors
    const filteredAndSortedMonitors = allMonitors.filter((m) => {
        if (monitorSearch) {
            const q = monitorSearch.toLowerCase();
            const matchName = (m.name || '').toLowerCase().includes(q);
            const matchUrl = m.url?.toLowerCase().includes(q);
            const matchTenant = m.tenantName?.toLowerCase().includes(q);
            if (!matchName && !matchUrl && !matchTenant) return false;
        }
        if (monitorFilters.assignment === 'assigned') return m.tenantId != null && m.tenantId !== SYSTEM_TENANT_ID;
        if (monitorFilters.assignment === 'unassigned') return m.tenantId == null || m.tenantId === SYSTEM_TENANT_ID;
        return true;
    }).filter((m) => {
        if (monitorFilters.tag === 'all') return true;
        return m.tags && m.tags.map(t => t.trim().toUpperCase()).includes(monitorFilters.tag);
    }).sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return monitorSort === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

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
                    <select
                        value={tenantSort}
                        onChange={e => setTenantSort(e.target.value as 'asc' | 'desc')}
                        className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-link/20 cursor-pointer text-slate-700"
                    >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                    </select>
                    <button
                        onClick={() => setIsCreatingTenant(true)}
                        className="flex items-center gap-2 bg-brand-link text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-link/90 transition-colors shadow-sm cursor-pointer shrink-0"
                    >
                        <Plus size={16} /> New
                    </button>
                </SectionHeader>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
                    {isCreatingTenant && (
                        <div className="border-2 border-brand-link/20 rounded-xl overflow-hidden bg-brand-link/5 shadow-sm shrink-0 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-brand-link/10">
                                <span className="font-extrabold text-brand-link text-sm">Create New Tenant</span>
                                <button onClick={() => setIsCreatingTenant(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                                    <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="Tenant Name" value={newTenantDraft.name} onChange={e => setNewTenantDraft({...newTenantDraft, name: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Litium Base URL</label>
                                    <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="https://example.com" value={newTenantDraft.litiumBaseUrl} onChange={e => setNewTenantDraft({...newTenantDraft, litiumBaseUrl: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Account Token</label>
                                    <input type="password" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm font-mono" placeholder="Secret Token" value={newTenantDraft.serviceAccountToken} onChange={e => setNewTenantDraft({...newTenantDraft, serviceAccountToken: e.target.value})} />
                                </div>
                                <button
                                    className="mt-2 bg-brand-link hover:bg-brand-link/90 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                                    disabled={!newTenantDraft.name || !newTenantDraft.litiumBaseUrl || createTenant.isPending}
                                    onClick={() => createTenant.mutate(newTenantDraft)}
                                >
                                    {createTenant.isPending ? 'Saving...' : 'Save Tenant'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                        {sortedTenants.map((t) => (
                            <TenantTile
                                key={t.id}
                                t={t}
                                deleteTenant={deleteTenant}
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
                    <select
                        value={monitorSort}
                        onChange={e => setMonitorSort(e.target.value as 'asc' | 'desc')}
                        className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-link/20 cursor-pointer text-slate-700"
                    >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                    </select>
                    <button
                        onClick={() => setIsCreatingMonitor(true)}
                        className="flex items-center gap-2 bg-brand-link text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-link/90 transition-colors shadow-sm cursor-pointer shrink-0"
                    >
                        <Plus size={16} /> New
                    </button>
                </SectionHeader>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
                    {isCreatingMonitor && (
                        <div className="border-2 border-brand-link/20 rounded-xl overflow-hidden bg-brand-link/5 shadow-sm shrink-0 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-brand-link/10">
                                <span className="font-extrabold text-brand-link text-sm">Create New Monitor</span>
                                <button onClick={() => setIsCreatingMonitor(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                                    <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="Monitor Name" value={newMonitorDraft.name} onChange={e => setNewMonitorDraft({...newMonitorDraft, name: e.target.value})} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL</label>
                                    <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="https://example.com" value={newMonitorDraft.url} onChange={e => setNewMonitorDraft({...newMonitorDraft, url: e.target.value})} />
                                </div>
                                 <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uptime SLA (%)</label>
                                    <input type="number" step="0.1" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" value={newMonitorDraft.uptimeSla} onChange={e => setNewMonitorDraft({...newMonitorDraft, uptimeSla: e.target.value === '' ? '' : parseFloat(e.target.value)})} placeholder="e.g. 99.9" />
                                </div>
                                <button
                                    className="mt-2 bg-brand-link hover:bg-brand-link/90 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                                    disabled={!newMonitorDraft.name || !newMonitorDraft.url || createMonitor.isPending}
                                    onClick={() => createMonitor.mutate({
                                        name: newMonitorDraft.name,
                                        url: newMonitorDraft.url,
                                        uptimeSla: newMonitorDraft.uptimeSla === '' ? null : newMonitorDraft.uptimeSla
                                    })}
                                >
                                    {createMonitor.isPending ? 'Saving...' : 'Save Monitor'}
                                </button>
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