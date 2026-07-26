import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SearchInput } from '../../components/common/ui/SearchInput';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';
import { useTenantsViewModel } from '../../hooks/useTenantsViewModel';
import { CreateTenantModal } from '../../components/settings/tenants/CreateTenantModal';
import { TenantRow } from '../../components/settings/tenants/TenantRow';
import { TenantSettingsFilterMenu } from '../../components/settings/tenants/SettingsFilterMenu';

export function TenantsMonitorsView() {
    const navigate = useNavigate();
    const {
        isAdmin,
        tenants,
        sortedTenants,
        tenantSearch,
        setTenantSearch,
        tenantFilters,
        setTenantFilters,
        tenantSort,
        setTenantSort,
        createTenant,
        deleteTenant,
    } = useTenantsViewModel();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());

    const handleSelect = (id: string) => {
        setSelectedTenantIds((prev) => {
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
        if (confirm(`Are you sure you want to delete ${selectedTenantIds.size} tenant(s)?`)) {
            const ids = Array.from(selectedTenantIds);
            ids.forEach(id => deleteTenant.mutate(id));
            setSelectedTenantIds(new Set());
        }
    };

    const handleEditSelected = () => {
        if (selectedTenantIds.size === 1) {
            const id = selectedTenantIds.values().next().value;
            if (id) {
                void navigate({ to: '/settings/tenants/$tenantId', params: { tenantId: id } });
            }
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full min-h-0">
            <SettingsPanel className="flex-1 max-h-none">
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
                                disabled={selectedTenantIds.size !== 1}
                                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                disabled={selectedTenantIds.size === 0}
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
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Tenant</th>
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Litium URL</th>
                                    <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Status</th>
                                    <th className="w-32 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Service Token</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {sortedTenants.map((t) => (
                                    <TenantRow
                                        key={t.id}
                                        t={t}
                                        selected={selectedTenantIds.has(t.id)}
                                        onSelect={() => isAdmin && handleSelect(t.id)}
                                        onDoubleClick={() => isAdmin && void navigate({ to: '/settings/tenants/$tenantId', params: { tenantId: t.id } })}
                                    />
                                ))}
                                {(!tenants || tenants.length === 0) && (
                                    <EmptyState message="No tenants found" isTableRow colSpan={5} />
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </SettingsPanel>

            {isAdmin && (
                <CreateTenantModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    createTenant={createTenant} 
                />
            )}
        </div>
    );
}
