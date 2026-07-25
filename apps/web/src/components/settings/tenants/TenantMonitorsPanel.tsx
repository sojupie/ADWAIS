import { useState, useMemo } from 'react';
import { Link as LinkIcon, Unlink } from 'lucide-react';
import type { UptimeMonitorDto } from '@types';
import { SearchInput } from '../../common/ui/SearchInput';
import { MonitorSettingsFilterMenu } from './SettingsFilterMenu';
import { MonitorRow } from './MonitorRow';

interface TenantMonitorsPanelProps {
    tenantId: string;
    allMonitors: UptimeMonitorDto[];
    allUniqueTypes: string[];
    allUniqueTags: string[];
    assignMonitor: (payload: { id: number; tenantId: string }) => void;
    unassignMonitor: (id: number) => void;
    isAssignPending: boolean;
    isUnassignPending: boolean;
    isAdmin: boolean;
}

export function TenantMonitorsPanel({
    tenantId,
    allMonitors,
    allUniqueTypes,
    allUniqueTags,
    assignMonitor,
    unassignMonitor,
    isAssignPending,
    isUnassignPending,
    isAdmin
}: TenantMonitorsPanelProps) {
    const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

    const [assignedSelected, setAssignedSelected] = useState<Set<number>>(new Set());
    const [availableSelected, setAvailableSelected] = useState<Set<number>>(new Set());
    
    // Filters for available monitors
    const [availableSearch, setAvailableSearch] = useState('');
    const [monitorFilters, setMonitorFilters] = useState<{ assignment: 'all' | 'assigned' | 'unassigned'; tag: string; status: 'all' | 'enabled' | 'disabled'; type: string }>({
        assignment: 'all',
        tag: 'all',
        status: 'all',
        type: 'all'
    });
    const [monitorSort, setMonitorSort] = useState<'asc' | 'desc'>('asc');

    const assignedMonitors = useMemo(() => {
        return allMonitors.filter(m => m.tenantId === tenantId).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [allMonitors, tenantId]);

    const availableMonitors = useMemo(() => {
        const filtered = allMonitors.filter(m => {
            if (m.tenantId === tenantId) return false;
            
            if (availableSearch) {
                const q = availableSearch.toLowerCase();
                const matchName = (m.name || '').toLowerCase().includes(q);
                const matchUrl = m.url?.toLowerCase().includes(q);
                if (!matchName && !matchUrl) return false;
            }
            
            if (monitorFilters.assignment === 'assigned' && (m.tenantId == null || m.tenantId === SYSTEM_TENANT_ID)) return false;
            if (monitorFilters.assignment === 'unassigned' && (m.tenantId != null && m.tenantId !== SYSTEM_TENANT_ID)) return false;

            if (monitorFilters.status === 'enabled' && !m.uptimeMonitorEnabled) return false;
            if (monitorFilters.status === 'disabled' && m.uptimeMonitorEnabled) return false;

            if (monitorFilters.type !== 'all' && m.type !== monitorFilters.type) return false;

            if (monitorFilters.tag !== 'all') {
                if (!m.tags || !m.tags.includes(monitorFilters.tag)) return false;
            }
            
            return true;
        });

        filtered.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return monitorSort === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });

        return filtered;
    }, [allMonitors, tenantId, availableSearch, monitorFilters, monitorSort]);

    const handleAssignSelected = () => {
        if (!isAdmin) return;
        const ids = Array.from(availableSelected);
        ids.forEach(id => assignMonitor({ id, tenantId }));
        setAvailableSelected(new Set());
    };

    const handleUnassignSelected = () => {
        if (!isAdmin) return;
        const ids = Array.from(assignedSelected);
        ids.forEach(id => unassignMonitor(id));
        setAssignedSelected(new Set());
    };

    const handleAssignedSelect = (id: number) => {
        setAssignedSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAvailableSelect = (id: number) => {
        setAvailableSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderThead = () => (
        <thead className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container text-on-surface-variant">
            <tr>
                <th className="w-12 px-4 py-4 sm:px-5"></th>
                <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Monitor</th>
                <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">URL</th>
                <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Type</th>
                <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Assignment</th>
                <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Status</th>
            </tr>
        </thead>
    );

    return (
        <>
            {/* Assigned Monitors */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-lg font-bold text-on-surface">Assigned Monitors</h3>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleUnassignSelected}
                            disabled={isUnassignPending || assignedSelected.size === 0}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-sm font-bold text-error transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
                        >
                            <Unlink size={16} /> Unassign Selected ({assignedSelected.size})
                        </button>
                    )}
                </div>

                <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface">
                    <div className="custom-scrollbar overflow-x-auto h-[600px] overflow-y-auto">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            {renderThead()}
                            <tbody className="divide-y divide-outline-variant">
                                {assignedMonitors.map(m => (
                                    <MonitorRow
                                        key={m.id}
                                        m={m}
                                        selected={m.id !== undefined ? assignedSelected.has(m.id) : false}
                                        onSelect={() => isAdmin && m.id !== undefined && handleAssignedSelect(m.id)}
                                    />
                                ))}
                                {assignedMonitors.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant italic sm:px-5">
                                            No monitors are currently assigned to this tenant.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Available Monitors */}
            {isAdmin && (
                <div className="space-y-4 xl:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4">
                        <div className="flex-1 space-y-1">
                            <h3 className="text-lg font-bold text-on-surface">Assignable Monitors</h3>
                            <p className="text-sm text-on-surface-variant">Select monitors to assign to this tenant. If a monitor is already assigned to another tenant, it will be reassigned.</p>
                        </div>
                        
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={handleAssignSelected}
                                disabled={isAssignPending || availableSelected.size === 0}
                                className="inline-flex shrink-0 min-h-10 items-center gap-2 rounded-full bg-primary-container px-5 text-sm font-bold text-on-primary-container transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38] disabled:hover:bg-on-surface/[0.1] disabled:hover:text-on-surface/[0.38]"
                            >
                                <LinkIcon size={16} /> Assign Selected ({availableSelected.size})
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pb-2">
                        <SearchInput
                            value={availableSearch}
                            onChange={setAvailableSearch}
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
                    </div>

                    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface">
                        <div className="custom-scrollbar overflow-x-auto h-[600px] overflow-y-auto">
                            <table className="w-full whitespace-nowrap text-left text-sm">
                                {renderThead()}
                                <tbody className="divide-y divide-outline-variant">
                                    {availableMonitors.map(m => (
                                        <MonitorRow
                                            key={m.id}
                                            m={m}
                                            selected={m.id !== undefined ? availableSelected.has(m.id) : false}
                                            onSelect={() => isAdmin && m.id !== undefined && handleAvailableSelect(m.id)}
                                        />
                                    ))}
                                    {availableMonitors.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant italic sm:px-5">
                                                No monitors available to assign.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
