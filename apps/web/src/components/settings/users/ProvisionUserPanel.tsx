import { useState } from 'react';
import { UserPlus, Shield } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <input 
          type="text" 
          placeholder="Full Name" 
          value={newUser.name} 
          onChange={e => setNewUser({ ...newUser, name: e.target.value })} 
          className="border border-slate-300 px-4 py-2.5 text-sm font-medium rounded-xl bg-white focus:ring-2 focus:ring-brand-link/20 focus:border-brand-link/30 focus:outline-none min-w-[200px]" 
        />
        <div className="relative">
           <select 
             value={newUser.role} 
             onChange={e => setNewUser({ ...newUser, role: e.target.value })} 
             className="appearance-none border border-slate-300 pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 rounded-xl bg-white w-full sm:w-36 focus:ring-2 focus:ring-brand-link/20 focus:border-brand-link/30 focus:outline-none cursor-pointer"
           >
             <option value="Admin">Admin</option>
             <option value="Viewer">Viewer</option>
             <option value="Employee">Employee</option>
           </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <Shield size={14} />
           </div>
        </div>
        <button 
          onClick={handleCreate} 
          disabled={!newUser.name || createUser.isPending} 
          className="bg-brand-link text-white px-6 py-2.5 text-sm font-bold rounded-xl hover:bg-brand-link/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {createUser.isPending ? 'Creating...' : 'Create'}
        </button>
      </div>
    </section>
  );
}
