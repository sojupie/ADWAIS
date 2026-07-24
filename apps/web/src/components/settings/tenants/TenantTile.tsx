import { useState } from 'react';
import { Trash2, Lock } from 'lucide-react';
import type { TenantResponseDto } from '@types';
import { TileCard } from '../../common/layout/TileCard';
import { TileSaveBar } from '../../common/ui/TileSaveBar';
import { useUpdateTenantMutation } from '../../../hooks/useTenantQueries';
import { Select } from '../../common/ui/Select';
import { CheckboxField, FormField } from '../../common/ui/FormField';

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
      <span className="flex min-w-0 items-center gap-3 text-base font-black text-on-surface">
        <FormField
          label="Tenant name"
          hideLabel
          variant="outlined"
          density="compact"
          containerClassName="min-w-0 flex-1"
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          disabled={!isAdmin}
          className="truncate text-xl font-black"
        />
        <Select
            value={draft.type}
            onChange={e => setDraft({ ...draft, type: e.target.value as 'Mixed' | 'B2B' | 'B2C' })}
            disabled={!isAdmin}
            indicator={null}
            variant="outlined"
            size="sm"
            fullWidth={false}
            containerClassName="w-auto shrink-0"
            className={`!rounded-full text-xs font-black uppercase tracking-widest ${isAdmin ? 'hover:brightness-95' : ''
              } ${draft.type === 'B2C' ? '!bg-chart-1 !text-white' :
                draft.type === 'Mixed' ? '!bg-chart-2 !text-white' :
                  '!bg-chart-3 !text-white'
            }`}
        >
          <option value="Mixed">MIXED</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
        </Select>
      </span>
      <span className="truncate font-mono text-xs font-medium text-on-surface-variant select-text">{t.id}</span>
    </>
  );

  const headerActions = isAdmin ? (
    <button
      onClick={() => { if (confirm('Delete tenant?')) deleteTenant.mutate(t.id); }}
      aria-label={`Delete ${t.name}`}
      className="ml-2 flex h-10 w-10 cursor-pointer items-baseline justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      title="Delete Tenant"
    >
      <Trash2 size={18} />
    </button>
  ) : (
    <span className="p-1.5 text-on-surface-variant opacity-60 cursor-not-allowed ml-2" title="Requires Admin privileges">
      <Lock size={14} />
    </span>
  );

  return (
    <TileCard header={header} headerActions={headerActions}>
      <FormField
        label="Litium Base URL"
        value={draft.litiumBaseUrl}
        onChange={e => setDraft({ ...draft, litiumBaseUrl: e.target.value })}
        disabled={!isAdmin}
        variant="outlined"
        className={"border border-outline"}
        density="compact"
        placeholder="https://..."
      />

      <FormField
        label="Image URL"
        value={draft.imageUrl}
        onChange={e => setDraft({ ...draft, imageUrl: e.target.value })}
        disabled={!isAdmin}
        variant="outlined"
        className={"border border-outline"}
        density="compact"
        placeholder="Google favicon fallback"
      />

      <FormField
        label="Service Account Token"
        type="password"
        value={draft.serviceAccountToken}
        disabled={!isAdmin || draft.clearToken}
        onChange={e => setDraft({ ...draft, serviceAccountToken: e.target.value, clearToken: false })}
        variant="outlined"
        className={"border border-outline"}
        density="compact"
        placeholder={draft.clearToken ? 'Cleared' : (t.hasServiceAccountToken ? '•••••••••••• (Type to change)' : 'Type to set new token')}
        meta={(
          <span className="flex items-center gap-3">
            {isAdmin && t.hasServiceAccountToken && !draft.clearToken && (
              <button
                type="button"
                onClick={() => setDraft({ ...draft, clearToken: true, serviceAccountToken: '' })}
                className="cursor-pointer rounded-full px-3 py-1 text-sm font-bold text-error transition-colors hover:bg-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-error"
              >
                Clear Token
              </button>
            )}
            <span className="text-xs italic text-on-surface-variant">
              {draft.clearToken ? 'Pending clear' : t.hasServiceAccountToken ? 'Token is set' : 'Not set'}
            </span>
          </span>
        )}
      />

      <CheckboxField
        id={`chk-${t.id}`}
        label="Enable Order Fetching"
        checked={draft.orderFetchingEnabled}
        disabled={!isAdmin}
        onChange={e => setDraft({ ...draft, orderFetchingEnabled: e.target.checked })}
      />

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
