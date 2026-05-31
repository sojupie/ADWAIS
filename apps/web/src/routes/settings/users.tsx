import { createFileRoute } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import { useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../hooks/useUserQueries';
import { UserRow } from '../../components/settings/users/UserRow';
import { ProvisionUserPanel } from '../../components/settings/users/ProvisionUserPanel';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SettingsPanel } from '../../components/common/SettingsPanel';
import { EmptyState } from '../../components/common/EmptyState';

export const Route = createFileRoute('/settings/users')({
  component: UsersView,
});

function UsersView() {
  // Queries & Mutations from custom hooks
  const { data: users } = useUsersQuery();
  const createUser = useCreateUserMutation();
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <ProvisionUserPanel createUser={createUser} />

      <SettingsPanel className="flex-1">
        <SectionHeader
          title="Active Users"
          subtitle="Manage directory"
          icon={<Users size={24} />}
        />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-[40%]">User</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-[30%]">Role Level</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users || []).map((u) => (
                  <UserRow 
                    key={u.id} 
                    u={u} 
                    updateUser={updateUser} 
                    deleteUser={deleteUser} 
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
