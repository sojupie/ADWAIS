import { useState } from 'react';
import { Trash2, Lock } from 'lucide-react';
import type { TenantResponseDto } from '@types';
import { TileCard } from '../../common/layout/TileCard';
import { TileSaveBar } from '../../common/ui/TileSaveBar';
import { useUpdateTenantMutation } from '../../../hooks/useTenantQueries';
import { Select } from '../../common/ui/Select';

interface TenantTileProps {
  t: TenantResponseDto;
  deleteTenant: {
    mutate: (id: string) => void;
  };
  isAdmin?: boolean;
}

export function TenantTile({ t, deleteTenant, isAdmin = false }: TenantTileProps) {
  const updateTenant = useUpdateTenantMutation();
  const [draft, setDraft] = useState({
    name: t.name,
    type: t.type ?? 'Mixed',
    litiumBaseUrl: t.litiumBaseUrl || '',
    imageUrl: t.imageUrl || '',
    serviceAccountToken: '',
    clearToken: false,
    orderFetchingEnabled: t.orderFetchingEnabled ?? false
  });

  const isDirty =
    draft.name !== t.name ||
    draft.type !== (t.type ?? 'Mixed') ||
    draft.litiumBaseUrl !== (t.litiumBaseUrl || '') ||
    draft.imageUrl !== (t.imageUrl || '') ||
    draft.serviceAccountToken !== '' ||
    draft.clearToken ||
    draft.orderFetchingEnabled !== (t.orderFetchingEnabled ?? false);

  const handleSave = () => {
    const payload: Partial<TenantResponseDto> & { serviceAccountToken?: string } = {};
    if (draft.name !== t.name) payload.name = draft.name;
    if (draft.type !== (t.type ?? 'Mixed')) payload.type = draft.type;
    if (draft.litiumBaseUrl !== (t.litiumBaseUrl || '')) payload.litiumBaseUrl = draft.litiumBaseUrl;
    if (draft.imageUrl !== (t.imageUrl || '')) payload.imageUrl = draft.imageUrl;

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
      imageUrl: t.imageUrl || '',
      serviceAccountToken: '',
      clearToken: false,
      orderFetchingEnabled: t.orderFetchingEnabled ?? false
    });
  };

  const header = (
    <>
      <span className="font-extrabold text-on-surface text-sm flex items-center gap-4 min-w-0">
        <input
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          disabled={!isAdmin}
          className={`bg-transparent border border-transparent rounded px-1 -ml-1 transition-all outline-none truncate flex-1 min-w-0 ${isAdmin ? 'hover:bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 hover:border-outline-variant focus:border-brand-accent/30' : 'cursor-not-allowed text-on-surface-variant'
            }`}
        />
        <Select
            value={draft.type}
            onChange={e => setDraft({ ...draft, type: e.target.value as 'Mixed' | 'B2B' | 'B2C' })}
            disabled={!isAdmin}
            indicator={null}
            variant="plain"
            size="xs"
            fullWidth={false}
            containerClassName="w-auto shrink-0"
            className={`uppercase tracking-widest shadow-sm text-white ${isAdmin ? 'hover:opacity-90' : ''
              } ${draft.type === 'B2B' ? '!bg-[var(--color-brand-btn-primary)]' :
                draft.type === 'B2C' ? '!bg-[#0ea5e9]' :
                  '!bg-[#8b5cf6]'
            }`}
        >
          <option value="Mixed">MIXED</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
        </Select>
      </span>
      <span className="text-sm text-on-surface-variant font-mono font-medium select-text cursor-text truncate">{t.id}</span>
    </>
  );

  const headerActions = isAdmin ? (
    <button
      onClick={() => { if (confirm('Delete tenant?')) deleteTenant.mutate(t.id); }}
      className="p-1.5 text-on-surface-variant hover:text-red-600 bg-surface rounded-lg cursor-pointer transition-colors shadow-sm ml-2"
      title="Delete Tenant"
    >
      <Trash2 size={14} />
    </button>
  ) : (
    <span className="p-1.5 text-on-surface-variant opacity-60 cursor-not-allowed ml-2" title="Requires Admin privileges">
      <Lock size={14} />
    </span>
  );

  return (
    <TileCard header={header} headerActions={headerActions}>
      <div className="flex flex-col gap-2 group">
        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Litium Base URL</label>
        <input
          value={draft.litiumBaseUrl}
          onChange={e => setDraft({ ...draft, litiumBaseUrl: e.target.value })}
          disabled={!isAdmin}
          className={`text-sm font-semibold text-on-surface bg-transparent border border-transparent rounded px-2 py-1 -ml-2 transition-all outline-none ${isAdmin ? 'hover:bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 hover:border-outline-variant focus:border-brand-accent/30' : 'cursor-not-allowed text-on-surface-variant'
            }`}
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col gap-2 group">
        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Image URL</label>
        <input
          value={draft.imageUrl}
          onChange={e => setDraft({ ...draft, imageUrl: e.target.value })}
          disabled={!isAdmin}
          className={`text-sm font-semibold text-on-surface bg-transparent border border-transparent rounded px-2 py-1 -ml-2 transition-all outline-none ${isAdmin ? 'hover:bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 hover:border-outline-variant focus:border-brand-accent/30' : 'cursor-not-allowed text-on-surface-variant'
            }`}
          placeholder="Google favicon fallback"
        />
      </div>

      <div className="flex flex-col gap-2 group">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Service Account Token</label>
          <div className="flex items-center gap-6">
            {isAdmin && t.hasServiceAccountToken && !draft.clearToken && (
              <button
                onClick={() => setDraft({ ...draft, clearToken: true, serviceAccountToken: '' })}
                className="text-sm text-red-500 hover:text-red-600 font-bold hover:underline cursor-pointer"
              >
                Clear Token
              </button>
            )}
            <span className="text-sm text-on-surface-variant italic">
              {draft.clearToken ? 'Pending clear' : t.hasServiceAccountToken ? 'Token is set' : 'Not set'}
            </span>
          </div>
        </div>
        <input
          type="password"
          value={draft.serviceAccountToken}
          disabled={!isAdmin || draft.clearToken}
          onChange={e => setDraft({ ...draft, serviceAccountToken: e.target.value, clearToken: false })}
          className={`text-sm font-mono font-semibold text-on-surface bg-transparent border border-transparent rounded px-2 py-1 -ml-2 transition-all outline-none ${isAdmin && !draft.clearToken ? 'hover:bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 hover:border-outline-variant focus:border-brand-accent/30' : 'cursor-not-allowed text-on-surface-variant opacity-50'
            }`}
          placeholder={draft.clearToken ? 'Cleared' : (t.hasServiceAccountToken ? '•••••••••••• (Type to change)' : 'Type to set new token')}
        />
      </div>

      <div className="flex items-center gap-4 group relative py-1">
        <input
          type="checkbox"
          checked={draft.orderFetchingEnabled}
          disabled={!isAdmin}
          onChange={(e) => setDraft({ ...draft, orderFetchingEnabled: e.target.checked })}
          className={`w-4 h-4 text-brand-link rounded border-outline-variant ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed text-on-surface-variant'}`}
          id={`chk-${t.id}`}
        />
        <label htmlFor={`chk-${t.id}`} className={`text-sm font-semibold select-none ${isAdmin ? 'text-on-surface-variant cursor-pointer' : 'text-slate-450 cursor-not-allowed'}`}>
          Enable Order Fetching
        </label>
      </div>

      {isAdmin && (
        <TileSaveBar
          isDirty={isDirty}
          isPending={updateTenant.isPending}
          isSuccess={updateTenant.isSuccess}
          isError={updateTenant.isError}
          errorMsg={updateTenant.error ? (updateTenant.error instanceof Error ? updateTenant.error.message : String(updateTenant.error)) : null}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </TileCard>
  );
}
