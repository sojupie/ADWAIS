import { Users } from 'lucide-react';
import { useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../hooks/useUserQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { UserRow } from '../../components/settings/users/UserRow';
import { ProvisionUserPanel } from '../../components/settings/users/ProvisionUserPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { EmptyState } from '../../components/common/ui/EmptyState';

export function UsersView() {
    // Queries & Mutations from custom hooks
    const { data: users } = useUsersQuery();
    const createUser = useCreateUserMutation();
    const updateUser = useUpdateUserMutation();
    const deleteUser = useDeleteUserMutation();
    const { role } = useCurrentUser();
    const isAdmin = role === 'Admin';

    return (
        <div className="flex flex-col gap-4 h-full min-h-0">
            {isAdmin && <ProvisionUserPanel createUser={createUser} />}

            <SettingsPanel className="flex-1">
                <SettingsPanelHeader
                    title="Active Users"
                    subtitle="Review access, roles and registered accounts."
                    icon={<Users size={24} />}
                />
                <div className="custom-scrollbar flex-1 overflow-y-auto">
                    <div className="custom-scrollbar overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            <thead className="border-b border-outline-variant bg-surface-container text-on-surface-variant">
                                <tr>
                                    <th className="px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">User</th>
                                    <th className="w-44 px-4 py-4 text-sm font-black uppercase tracking-widest sm:px-5">Role</th>
                                    <th className="w-28 px-4 py-4 text-right text-sm font-black uppercase tracking-widest sm:px-5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {(users || []).map((u) => (
                                    <UserRow
                                        key={u.id}
                                        u={u}
                                        updateUser={updateUser}
                                        deleteUser={deleteUser}
                                        disabled={!isAdmin}
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
    );
}
