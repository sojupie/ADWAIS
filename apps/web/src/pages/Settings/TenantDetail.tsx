import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Building2, Save, X, Trash2 } from 'lucide-react';
import { useTenantsViewModel } from '../../hooks/useTenantsViewModel';
import { useUpdateTenantMutation, useDeleteTenantMutation } from '../../hooks/useTenantQueries';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { FormField, CheckboxField } from '../../components/common/ui/FormField';
import { Button } from '../../components/common/ui/Button';
import { TenantMonitorsPanel } from '../../components/settings/tenants/TenantMonitorsPanel';
import { getTenantFaviconUrl } from '../../utils/tenantHelper';
import type { TenantResponseDto } from '@types';

function TenantDetailForm({ tenant, isAdmin, onBack }: { tenant: TenantResponseDto, isAdmin: boolean, onBack: () => void }) {
  const navigate = useNavigate();
  const updateTenant = useUpdateTenantMutation();
  const deleteTenant = useDeleteTenantMutation();
  const hasAuthorization = tenant.orderProviderConfiguredSecretKeys.includes('authorization');
  
  const getInitialDraft = (t: TenantResponseDto) => ({
    name: t.name || '',
    endpointUrl: t.orderProviderSettings?.endpointUrl || '',
    imageUrl: t.imageUrl || '',
    authorization: '',
    clearAuthorization: false,
    orderFetchingEnabled: t.orderFetchingEnabled ?? false,
  });

  const [draft, setDraft] = useState(getInitialDraft(tenant));
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [prevTenant, setPrevTenant] = useState(tenant);
  const [imgError, setImgError] = useState(false);

  const faviconUrl = draft.imageUrl || getTenantFaviconUrl(draft.endpointUrl);
  const showIcon = !faviconUrl || imgError;

  // When background data refreshes, only update the draft if the user isn't actively editing
  if (tenant !== prevTenant) {
    setPrevTenant(tenant);
    if (!isUserEditing) {
      setDraft(getInitialDraft(tenant));
    }
  }

  const isDirty =
    draft.name !== (tenant.name || '') ||
    draft.endpointUrl !== (tenant.orderProviderSettings?.endpointUrl || '') ||
    draft.imageUrl !== (tenant.imageUrl || '') ||
    draft.authorization !== '' ||
    draft.clearAuthorization ||
    draft.orderFetchingEnabled !== (tenant.orderFetchingEnabled ?? false);

  const handleSave = () => {
    const payload: Partial<TenantResponseDto> = {};
    if (draft.name !== tenant.name) payload.name = draft.name;
    if (draft.endpointUrl !== (tenant.orderProviderSettings?.endpointUrl || '')) payload.orderProviderSettings = { endpointUrl: draft.endpointUrl };
    if (draft.imageUrl !== (tenant.imageUrl || '')) payload.imageUrl = draft.imageUrl;
    
    if (draft.clearAuthorization) {
      payload.orderProviderSettings = { ...payload.orderProviderSettings, authorization: null };
    } else if (draft.authorization !== '') {
      payload.orderProviderSettings = { ...payload.orderProviderSettings, authorization: draft.authorization };
    }

    if (draft.orderFetchingEnabled !== (tenant.orderFetchingEnabled ?? false)) payload.orderFetchingEnabled = draft.orderFetchingEnabled;

    updateTenant.mutate(
      { id: tenant.id, payload },
      {
        onSuccess: () => {
          setIsUserEditing(false);
          setDraft(d => ({ ...d, authorization: '', clearAuthorization: false }));
          setTimeout(() => {
            updateTenant.reset();
          }, 3000);
        }
      }
    );
  };

  const handleCancel = () => {
    setIsUserEditing(false);
    setDraft(getInitialDraft(tenant));
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      deleteTenant.mutate(tenant.id, {
        onSuccess: () => {
          void navigate({ to: '/settings/tenants' });
        }
      });
    }
  };

  // Helper to update draft and mark as user editing
  const updateDraft = (updates: Partial<typeof draft>) => {
    setIsUserEditing(true);
    setDraft(prev => ({ ...prev, ...updates }));
  };

  return (
    <>
        <SettingsPanelHeader
          title="Edit Tenant"
          subtitle={`Editing details for ${tenant.name}`}
          iconContainerClassName={!showIcon ? 'overflow-hidden bg-transparent' : undefined}
          icon={showIcon ? <Building2 size={24} /> : <img src={faviconUrl!} alt={tenant.name || ''} className="h-full w-full object-cover" onError={() => setImgError(true)} />}
          onBack={onBack}
        >
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDelete}
                disabled={!isAdmin || deleteTenant.isPending}
                variant="text"
                color="error"
                icon={<Trash2 size={16} />}
              >
                Delete Tenant
              </Button>
              <Button
                onClick={handleCancel}
                disabled={!isAdmin || !isDirty || updateTenant.isPending}
                variant="text"
                color="surface"
                icon={<X size={16} />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isAdmin || !isDirty || updateTenant.isPending}
                variant="tonal"
                color="primary"
                icon={<Save size={16} />}
              >
                Save Changes
              </Button>
            </div>
        </SettingsPanelHeader>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-2">
          
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface">Tenant Details</h3>
            <FormField
              id="tenant-name"
              label="Name"
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              disabled={!isAdmin}
            />

            <FormField
              id="tenant-provider-endpoint"
              label="Order Provider Endpoint"
              type="url"
              value={draft.endpointUrl}
              onChange={(e) => updateDraft({ endpointUrl: e.target.value })}
              disabled={!isAdmin}
            />

            <FormField
              id="tenant-image-url"
              label="Image URL"
              type="url"
              value={draft.imageUrl}
              onChange={(e) => updateDraft({ imageUrl: e.target.value })}
              disabled={!isAdmin}
            />

            <FormField
              id="tenant-token"
              label="Order Provider Authorization"
              type="password"
              value={draft.authorization}
              disabled={!isAdmin || draft.clearAuthorization}
              onChange={(e) => updateDraft({ authorization: e.target.value, clearAuthorization: false })}
              placeholder={draft.clearAuthorization ? 'Cleared' : (hasAuthorization ? '•••••••••••• (Type to change)' : 'Type to set')}
              meta={(
                <span className="flex items-center gap-3">
                  {hasAuthorization && !draft.clearAuthorization && (
                    <button
                      type="button"
                      onClick={() => updateDraft({ clearAuthorization: true, authorization: '' })}
                      disabled={!isAdmin}
                      className="cursor-pointer rounded-full px-3 py-1 text-sm font-bold text-error transition-colors hover:bg-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
                    >
                      Clear Authorization
                    </button>
                  )}
                  <span className="text-xs italic text-on-surface-variant">
                    {draft.clearAuthorization ? 'Pending clear' : hasAuthorization ? 'Configured' : 'Not configured'}
                  </span>
                </span>
              )}
            />

            <CheckboxField
              id="tenant-fetching"
              label="Enable Order Fetching"
              checked={draft.orderFetchingEnabled}
              disabled={!isAdmin}
              onChange={e => updateDraft({ orderFetchingEnabled: e.target.checked })}
            />
          </div>

          <TenantMonitorsPanel tenantId={tenant.id} />
        </div>
      </div>
    </>
  );
}

export function TenantDetailView() {
  const navigate = useNavigate();
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };
  const { tenants, isAdmin } = useTenantsViewModel();
  
  const tenant = tenants?.find(t => t.id === tenantId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <SettingsPanel className="flex-1 max-h-none">
        {!tenant ? (
            <SettingsPanelHeader
                title="Edit Tenant"
                subtitle="Loading..."
                icon={<Building2 size={24} />}
                onBack={() => void navigate({ to: '/settings/tenants' })}
            />
        ) : (
            <TenantDetailForm key={tenant.id} tenant={tenant} isAdmin={isAdmin} onBack={() => void navigate({ to: '/settings/tenants' })} />
        )}
      </SettingsPanel>
    </div>
  );
}
