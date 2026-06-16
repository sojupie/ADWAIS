import { useState } from 'react';
import { UserPlus, Shield } from 'lucide-react';
import { Input } from '../../common/ui/Input';
import { Select } from '../../common/ui/Select';
import { SecureButton } from '../../common/ui/SecureButton';

interface ProvisionUserPanelProps {
  createUser: {
    mutate: (user: { name: string; role: string }) => void;
    isPending: boolean;
  };
}

export function ProvisionUserPanel({ createUser }: ProvisionUserPanelProps) {
  const [newUser, setNewUser] = useState({ name: '', role: 'Admin' });

  const handleCreate = () => {
    createUser.mutate(newUser);
    setNewUser({ name: '', role: 'Admin' });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-6 items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-brand-bg-secondary text-white rounded-xl shadow-sm">
          <UserPlus size={24} />
        </div>
        <div>
          <h3 className="font-bold text-brand-text text-lg">Provision New User</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Add a new administrator or user to the system</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-end">
        <Input
          type="text"
          placeholder="Full Name"
          value={newUser.name}
          onChange={e => setNewUser({ ...newUser, name: e.target.value })}
          containerClassName="min-w-[200px] sm:w-auto"
        />
        <Select
          value={newUser.role}
          onChange={e => setNewUser({ ...newUser, role: e.target.value })}
          icon={<Shield size={14} />}
          containerClassName="w-full sm:w-36"
        >
          <option value="Admin">Admin</option>
          <option value="Viewer">Viewer</option>
          <option value="Employee">Employee</option>
        </Select>
        <SecureButton
          onClick={handleCreate}
          disabled={!newUser.name}
          loading={createUser.isPending}
          loadingText="Creating..."
          className="bg-brand-link text-white px-6 py-2.5 text-sm font-bold rounded-xl hover:bg-brand-link/90 transition-all cursor-pointer flex items-center justify-center gap-2 h-10 w-full sm:w-auto shrink-0"
        >
          Create
        </SecureButton>
      </div>
    </section>
  );
}
