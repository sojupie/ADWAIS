import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Users, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { apiFetch } from '../../apiClient';

import { InlineEditField } from '../../components/common/InlineEditField';

export const Route = createFileRoute('/settings/users')({
  component: UsersView,
});

function UsersView() {
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({ name: '', role: 'Admin' });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<any[]>('/api/users')
  });

  const createUser = useMutation({
    mutationFn: (user: { name: string, role: string }) => apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUser({ name: '', role: 'Admin' });
    }
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => apiFetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-250px)] min-h-[500px]">
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
            className="border border-slate-300 px-4 py-2.5 text-sm font-medium rounded-xl bg-white focus:ring-2 focus:ring-brand-accent focus:outline-none min-w-[200px]" 
          />
          <div className="relative">
             <select 
               value={newUser.role} 
               onChange={e => setNewUser({ ...newUser, role: e.target.value })} 
               className="appearance-none border border-slate-300 pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 rounded-xl bg-white w-full sm:w-36 focus:ring-2 focus:ring-brand-accent focus:outline-none cursor-pointer"
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
            onClick={() => createUser.mutate(newUser)} 
            disabled={!newUser.name} 
            className="bg-brand-accent text-white px-6 py-2.5 text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-accent/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Create
          </button>
        </div>
      </section>

      <section className="flex flex-col flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-brand-bg-secondary shrink-0 z-10">
          <div className="p-2 bg-white/10 text-white rounded-lg shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Active Users</h2>
            <p className="text-xs font-semibold text-slate-300">Manage directory</p>
          </div>
        </div>
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
              {(users || []).map((u: any) => (
                <tr key={u.id} className="transition-colors group hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-lg">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col w-full max-w-[250px]">
                        <InlineEditField
                           label="Full Name"
                           value={u.name}
                           required
                           displayValue={
                             <div className="flex flex-col">
                               <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                               <span className="text-xs text-slate-400 font-mono mt-0.5">{u.id}</span>
                             </div>
                           }
                           onSave={(val) => updateUser.mutate({ id: u.id, payload: { name: val }})}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top pt-5 w-48">
                    <InlineEditField
                       label="Role Level"
                       type="select"
                       value={u.role}
                       options={[
                         { label: 'Admin', value: 'Admin' },
                         { label: 'Viewer', value: 'Viewer' },
                         { label: 'Employee', value: 'Employee' },
                       ]}
                       displayValue={
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                           u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                           u.role === 'Employee' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                         }`}>
                           {u.role === 'Admin' ? <Shield size={12} /> : <User size={12} />}
                           {u.role}
                         </span>
                       }
                       onSave={(val) => updateUser.mutate({ id: u.id, payload: { role: val }})}
                    />
                  </td>
                  <td className="px-6 py-4 text-right align-top pt-7">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => { if(confirm('Revoke access for this user?')) deleteUser.mutate(u.id); }} 
                        className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 size={16} /> Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </section>
    </div>
  );
}
