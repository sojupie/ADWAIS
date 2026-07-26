import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Users, Edit2, Trash2, UserPlus } from 'lucide-react';
import { useUsersQuery, useCreateUserMutation, useDeleteUserMutation } from '../../hooks/useUserQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { UserRow } from '../../components/settings/users/UserRow';
import { ProvisionUserModal } from '../../components/settings/users/ProvisionUserModal';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';

export function UsersView() {
    const navigate = useNavigate();
    const { data: users } = useUsersQuery();
    const createUser = useCreateUserMutation();
    const deleteUser = useDeleteUserMutation();
    const { role } = useCurrentUser();
    const isAdmin = role === 'Admin';
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleSelect = (id: string) => {
        setSelectedUserIds((prev) => {
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
        if (confirm(`Are you sure you want to delete ${selectedUserIds.size} user(s)?`)) {
            const ids = Array.from(selectedUserIds);
            ids.forEach(id => deleteUser.mutate(id));
            setSelectedUserIds(new Set());
        }
    };

    const handleEditSelected = () => {
        if (selectedUserIds.size === 1) {
            const id = selectedUserIds.values().next().value;
            if (id) {
                void navigate({ to: '/settings/users/$userId', params: { userId: id } });
            }
        }
    };

    return (
        <div className="grid grid-cols-1 landscape-contained:grid-cols-1 portrait-contained:grid-rows-1 gap-4 h-full min-h-0">
            <div className="flex min-h-0 flex-col gap-4 h-full">
            <SettingsPanel className="flex-1 max-h-none">
                <SettingsPanelHeader
                    title="Active Users"
                    subtitle="Review access, roles and registered accounts."
                    icon={<Users size={24} />}
                >
                    {isAdmin && (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-container px-5 text-sm font-bold text-on-secondary-container transition-colors hover:m3-elevation-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                            >
                                <UserPlus size={16} /> Add user
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSelected}
                                disabled={selectedUserIds.size !== 1}
                                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                disabled={selectedUserIds.size === 0}
                                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold text-error transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
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
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">User</th>
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Email</th>
                                    <th className="w-44 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {(users || []).map((u) => (
                                    <UserRow
                                        key={u.id}
                                        u={u}
                                        selected={selectedUserIds.has(u.id)}
                                        onSelect={() => isAdmin && handleSelect(u.id)}
                                        onDoubleClick={() => isAdmin && void navigate({ to: '/settings/users/$userId', params: { userId: u.id } })}
                                    />
                                ))}
                                {(!users || users.length === 0) && (
                                    <EmptyState message="No active users registered." isTableRow colSpan={3} />
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </SettingsPanel>
            </div>
            
            {isAdmin && (
                <ProvisionUserModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    createUser={createUser} 
                />
            )}
        </div>
    );
}
