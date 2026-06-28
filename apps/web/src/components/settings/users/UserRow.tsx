import { Trash2, Shield, User } from 'lucide-react';
import { InlineEditField } from '../../common/ui/InlineEditField';
import type { UserResponseDto } from '@types';

interface UserRowProps {
  u: UserResponseDto;
  updateUser: {
    mutate: (variables: { id: string; payload: Partial<UserResponseDto> }) => void;
  };
  deleteUser: {
    mutate: (id: string) => void;
  };
  disabled?: boolean;
}

export function UserRow({ u, updateUser, deleteUser, disabled = false }: UserRowProps) {
  return (
    <tr className="transition-colors group hover:bg-slate-50/80">
      <td className="px-6 py-3 align-middle">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-lg shrink-0">
            {u.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col w-full max-w-[250px]">
            <InlineEditField
               hideLabel={true}
               label="Full Name"
               value={u.name}
               required
               disabled={disabled}
               displayValue={
                 <div className="flex flex-col">
                   <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                   {u.email && u.email !== u.name && (
                     <span className="text-xs text-slate-500 font-medium mt-0.5">{u.email}</span>
                   )}
                   <span className="text-xs text-slate-400 font-mono mt-0.5">{u.id}</span>
                 </div>
               }
               onSave={(val) => updateUser.mutate({ id: u.id, payload: { name: val }})}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-3 align-middle w-44">
        <InlineEditField
           hideLabel={true}
           label="Role Level"
           type="select"
           value={u.role}
           disabled={disabled}
           options={[
             { label: 'Admin', value: 'Admin' },
             { label: 'Viewer', value: 'Viewer' },
             { label: 'Employee', value: 'Employee' },
           ]}
           displayValue={
             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${
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
      <td className="px-6 py-3 align-middle text-right w-28">
        {!disabled && (
          <button 
            onClick={() => { if(confirm('Revoke access for this user?')) deleteUser.mutate(u.id); }} 
            className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold transition-colors group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 size={16} /> Revoke
          </button>
        )}
      </td>
    </tr>
  );
}
