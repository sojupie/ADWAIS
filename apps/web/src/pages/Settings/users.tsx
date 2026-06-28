import { Users } from 'lucide-react';
import { useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../hooks/useUserQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { UserRow } from '../../components/settings/users/UserRow';
import { ProvisionUserPanel } from '../../components/settings/users/ProvisionUserPanel';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
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
        <div className="flex flex-col gap-2 h-full min-h-0">
            {isAdmin && <ProvisionUserPanel createUser={createUser} />}

            <SettingsPanel className="flex-1">
                <SectionHeader
                    title="Active Users"
                    subtitle="Manage directory"
                    icon={<Users size={24} />}
                />
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-xl shadow-sm border border-slate-200/60">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider w-44">Role Level</th>
                                    <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-right w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
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
