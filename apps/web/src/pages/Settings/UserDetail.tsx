import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { User as UserIcon, Trash2, Save, X } from 'lucide-react';
import { useUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from '../../hooks/useUserQueries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { FormField } from '../../components/common/ui/FormField';
import type { UserRole, UserResponseDto } from '@types';

function UserDetailForm({ user, isAdmin }: { user: UserResponseDto, isAdmin: boolean }) {
  const navigate = useNavigate();
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();

  const [draft, setDraft] = useState({
    name: user.name || '',
    email: user.email || '',
    role: (user.role as UserRole) || 'Viewer',
  });

  const isDirty = draft.name !== (user.name || '') || draft.role !== ((user.role as UserRole) || 'Viewer');

  const handleSave = () => {
    updateUser.mutate(
      { id: user.id, payload: { name: draft.name, role: draft.role } },
      {
        onSuccess: () => {
          setTimeout(() => {
            updateUser.reset();
          }, 3000);
        },
      }
    );
  };

  const handleCancel = () => {
    setDraft({
      name: user.name || '',
      email: user.email || '',
      role: (user.role as UserRole) || 'Viewer',
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser.mutate(user.id, {
        onSuccess: () => {
          void navigate({ to: '/settings/users' });
        },
      });
    }
  };

  return (
    <>
      <SettingsPanelHeader
        title="Edit User"
        subtitle={`Editing details for ${user.email}`}
        icon={<UserIcon size={24} />}
        onBack={() => void navigate({ to: '/settings/users' })}
      >
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteUser.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-error transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
              >
                <Trash2 size={16} /> Revoke Access
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!isDirty || updateUser.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || updateUser.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-container px-4 text-sm font-bold text-on-primary-container transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38] disabled:hover:bg-on-surface/[0.1] disabled:hover:text-on-surface/[0.38]"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          )}
        </SettingsPanelHeader>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <FormField
            id="user-email"
            label="Email Address"
            value={draft.email}
            disabled
            helperText="Email addresses cannot be changed."
          />

          <FormField
            id="user-name"
            label="Full Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            disabled={!isAdmin}
          />

          <FormField
            as="select"
            id="user-role"
            label="Role"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })}
            disabled={!isAdmin}
          >
            <option value="Admin">Admin</option>
            <option value="Viewer">Viewer</option>
            <option value="Employee">Employee</option>
          </FormField>
        </div>
      </div>
    </>
  );
}

export function UserDetailView() {
  const navigate = useNavigate();
  const { userId } = useParams({ strict: false }) as { userId: string };
  const { data: users, isLoading } = useUsersQuery();
  const { role: currentUserRole } = useCurrentUser();
  const isAdmin = currentUserRole === 'Admin';

  const user = users?.find(u => u.id === userId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <SettingsPanel className="flex-1">
        {isLoading && (
          <SettingsPanelHeader
            title="Edit User"
            subtitle="Loading..."
            icon={<UserIcon size={24} />}
            onBack={() => void navigate({ to: '/settings/users' })}
          />
        )}
        {!isLoading && !user && <div className="p-8 text-center text-error">User not found.</div>}
        {!isLoading && user && <UserDetailForm key={user.id} user={user} isAdmin={isAdmin} />}
      </SettingsPanel>
    </div>
  );
}
