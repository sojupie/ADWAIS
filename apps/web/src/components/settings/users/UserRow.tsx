import { Trash2, Shield, User } from 'lucide-react';
import { InlineEditField } from '../../common/ui/InlineEditField';
import type { UserResponseDto } from '@types';

interface UserRowProps {
  u: UserResponseDto;
  updateUser: {
    mutateAsync: (variables: { id: string; payload: Partial<UserResponseDto> }) => Promise<void>;
  };
  deleteUser: {
    mutate: (id: string) => void;
  };
  disabled?: boolean;
}

export function UserRow({ u, updateUser, deleteUser, disabled = false }: UserRowProps) {
  return (
    <tr className="group transition-colors hover:bg-surface-container-high">
      <td className="px-4 py-3 align-middle sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-lg font-bold text-on-primary-container">
            {u.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col w-full max-w-[250px]">
            <InlineEditField
               hideLabel={true}
               label="Full Name"
               value={u.name}
               required
               disabled={disabled}
               renderValue={
                 <div className="flex flex-col">
                   <span className="text-base font-bold text-on-surface">{u.name}</span>
                   {u.email && u.email !== u.name && (
                     <span className="mt-0.5 text-sm font-medium text-on-surface-variant">{u.email}</span>
                   )}
                   <span className="text-xs text-on-surface-variant font-mono mt-0.5">{u.id}</span>
                 </div>
               }
               onCommit={(val) => updateUser.mutateAsync({ id: u.id, payload: { name: val }})}
            />
          </div>
        </div>
      </td>
      <td className="w-44 px-4 py-3 align-middle sm:px-5">
        <InlineEditField
           hideLabel={true}
           label="Role Level"
           kind="select"
           value={u.role}
           disabled={disabled}
           options={[
             { label: 'Admin', value: 'Admin' },
             { label: 'Viewer', value: 'Viewer' },
             { label: 'Employee', value: 'Employee' },
           ]}
           renderValue={
             <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
               u.role === 'Admin' ? 'bg-tertiary-container text-on-tertiary-container' :
               u.role === 'Employee' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'
             }`}>
               {u.role === 'Admin' ? <Shield size={12} /> : <User size={12} />}
               {u.role}
             </span>
           }
           onCommit={(val) => updateUser.mutateAsync({ id: u.id, payload: { role: val }})}
        />
      </td>
      <td className="w-28 px-4 py-3 text-right align-middle sm:px-5">
        {!disabled && (
          <button 
            onClick={() => { if(confirm('Revoke access for this user?')) deleteUser.mutate(u.id); }} 
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-bold text-error transition-colors hover:bg-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          >
            <Trash2 size={16} /> Revoke
          </button>
        )}
      </td>
    </tr>
  );
}
