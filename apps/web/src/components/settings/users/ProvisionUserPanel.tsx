import { useState } from 'react';
import { UserPlus, Shield } from 'lucide-react';
import { Input } from '../../common/ui/Input';
import { Select } from '../../common/ui/Select';
import { SecureButton } from '../../common/ui/SecureButton';

interface ProvisionUserPanelProps {
  createUser: {
    mutate: (user: { email: string; role: string }) => void;
    isPending: boolean;
  };
}

export function ProvisionUserPanel({ createUser }: ProvisionUserPanelProps) {
  const [newUser, setNewUser] = useState({ email: '', role: 'Admin' });

  const handleCreate = () => {
    createUser.mutate(newUser);
    setNewUser({ email: '', role: 'Admin' });
  };

  return (
    <section className="flex shrink-0 flex-col items-start justify-between gap-4 rounded-2xl border border-outline bg-surface p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <UserPlus size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-on-surface sm:text-lg">Provision a user</h3>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">Add an account and choose its initial access level.</p>
        </div>
      </div>
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-end">
        <Input
          type="email"
          placeholder="Email Address"
          value={newUser.email}
          onChange={e => setNewUser({ ...newUser, email: e.target.value })}
          containerClassName="min-w-[200px] w-full sm:w-auto"
          aria-label="Email address"
        />
        <Select
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            indicator={<Shield size={14} />}
            containerClassName="w-full sm:w-36"
        >
          <option value="Admin">Admin</option>
          <option value="Viewer">Viewer</option>
          <option value="Employee">Employee</option>
        </Select>
        <SecureButton
          onClick={handleCreate}
          disabled={!newUser.email}
          loading={createUser.isPending}
          loadingText="Creating..."
          className="inline-flex min-h-11 w-fit shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        >
          Add user
        </SecureButton>
      </div>
    </section>
  );
}
