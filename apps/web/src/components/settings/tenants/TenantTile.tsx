import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { TenantResponseDto } from '@types';
import { TileCard } from '../../common/layout/TileCard';
import { TileSaveBar } from '../../common/ui/TileSaveBar';
import { useUpdateTenantMutation } from '../../../hooks/useTenantQueries';

interface TenantTileProps {
  t: TenantResponseDto;
  deleteTenant: {
    mutate: (id: string) => void;
  };
}

export function TenantTile({ t, deleteTenant }: TenantTileProps) {
  const updateTenant = useUpdateTenantMutation();
  const [draft, setDraft] = useState({
    name: t.name,
    type: t.type ?? 'Mixed',
    litiumBaseUrl: t.litiumBaseUrl || '',
    serviceAccountToken: '',
    clearToken: false,
    orderFetchingEnabled: t.orderFetchingEnabled ?? false
  });

  const isDirty =
    draft.name !== t.name ||
    draft.type !== (t.type ?? 'Mixed') ||
    draft.litiumBaseUrl !== (t.litiumBaseUrl || '') ||
    draft.serviceAccountToken !== '' ||
    draft.clearToken ||
    draft.orderFetchingEnabled !== (t.orderFetchingEnabled ?? false);

  const handleSave = () => {
    const payload: Partial<TenantResponseDto> & { serviceAccountToken?: string } = {};
    if (draft.name !== t.name) payload.name = draft.name;
    if (draft.type !== (t.type ?? 'Mixed')) payload.type = draft.type;
    if (draft.litiumBaseUrl !== (t.litiumBaseUrl || '')) payload.litiumBaseUrl = draft.litiumBaseUrl;
    
    if (draft.clearToken) {
      payload.serviceAccountToken = '';
    } else if (draft.serviceAccountToken !== '') {
      payload.serviceAccountToken = draft.serviceAccountToken;
    }

    if (draft.orderFetchingEnabled !== (t.orderFetchingEnabled ?? false)) payload.orderFetchingEnabled = draft.orderFetchingEnabled;
    
    updateTenant.mutate(
      { id: t.id, payload },
      {
        onSuccess: () => {
          setDraft(d => ({ ...d, serviceAccountToken: '', clearToken: false }));
          setTimeout(() => {
            updateTenant.reset();
          }, 3000);
        }
      }
    );
  };

  const handleCancel = () => {
    setDraft({
      name: t.name,
      type: t.type ?? 'Mixed',
      litiumBaseUrl: t.litiumBaseUrl || '',
      serviceAccountToken: '',
      clearToken: false,
      orderFetchingEnabled: t.orderFetchingEnabled ?? false
    });
  };

  const header = (
    <>
      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2 min-w-0">
        <input
          value={draft.name}
          onChange={e => setDraft({...draft, name: e.target.value})}
          className="bg-transparent hover:bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 border border-transparent hover:border-slate-300 focus:border-brand-accent/30 rounded px-1 -ml-1 transition-all outline-none truncate flex-1 min-w-0"
        />
        <select
          value={draft.type}
          onChange={e => setDraft({...draft, type: e.target.value as 'Mixed' | 'B2B' | 'B2C'})}
          className={`px-1.5 py-0.5 rounded-[4px] text-xs uppercase font-bold tracking-widest shadow-sm text-white cursor-pointer hover:opacity-90 outline-none shrink-0 ${
            draft.type === 'B2B' ? 'bg-[var(--color-brand-btn-primary)]' :
            draft.type === 'B2C' ? 'bg-[#0ea5e9]' :
            'bg-[#8b5cf6]'
          }`}
        >
          <option value="Mixed" className="text-slate-800 bg-white">MIXED</option>
          <option value="B2B" className="text-slate-800 bg-white">B2B</option>
          <option value="B2C" className="text-slate-800 bg-white">B2C</option>
        </select>
      </span>
      <span className="text-xs text-slate-400 font-mono font-medium select-text cursor-text truncate">{t.id}</span>
    </>
  );

  const headerActions = (
    <button
      onClick={() => { if(confirm('Delete tenant?')) deleteTenant.mutate(t.id); }}
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer transition-colors shadow-sm ml-2"
      title="Delete Tenant"
    >
      <Trash2 size={14} />
    </button>
  );

  return (
    <TileCard header={header} headerActions={headerActions}>
      <div className="flex flex-col gap-1 group">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Litium Base URL</label>
        <input
          value={draft.litiumBaseUrl}
          onChange={e => setDraft({...draft, litiumBaseUrl: e.target.value})}
          className="text-sm font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 border border-transparent hover:border-slate-200 focus:border-brand-accent/30 rounded px-2 py-1 -ml-2 transition-all outline-none"
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col gap-1 group">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Account Token</label>
          <div className="flex items-center gap-3">
            {t.hasServiceAccountToken && !draft.clearToken && (
               <button 
                 onClick={() => setDraft({ ...draft, clearToken: true, serviceAccountToken: '' })}
                 className="text-xs text-red-500 hover:text-red-600 font-bold hover:underline cursor-pointer"
               >
                 Clear Token
               </button>
            )}
            <span className="text-xs text-slate-400 italic">
               {draft.clearToken ? 'Pending clear' : t.hasServiceAccountToken ? 'Token is set' : 'Not set'}
            </span>
          </div>
        </div>
        <input
          type="password"
          value={draft.serviceAccountToken}
          disabled={draft.clearToken}
          onChange={e => setDraft({...draft, serviceAccountToken: e.target.value, clearToken: false})}
          className="text-sm font-mono font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 border border-transparent hover:border-slate-200 focus:border-brand-accent/30 rounded px-2 py-1 -ml-2 transition-all outline-none disabled:opacity-50"
          placeholder={draft.clearToken ? 'Cleared' : (t.hasServiceAccountToken ? '•••••••••••• (Type to change)' : 'Type to set new token')}
        />
      </div>

      <div className="flex items-center gap-2 group relative py-1">
        <input
          type="checkbox"
          checked={draft.orderFetchingEnabled}
          onChange={(e) => setDraft({...draft, orderFetchingEnabled: e.target.checked})}
          className="w-4 h-4 text-brand-link cursor-pointer rounded border-slate-300"
          id={`chk-${t.id}`}
        />
        <label htmlFor={`chk-${t.id}`} className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
          Enable Order Fetching
        </label>
      </div>

      <TileSaveBar
        isDirty={isDirty}
        isPending={updateTenant.isPending}
        isSuccess={updateTenant.isSuccess}
        isError={updateTenant.isError}
        errorMsg={updateTenant.error ? (updateTenant.error as any).message || String(updateTenant.error) : null}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </TileCard>
  );
}
