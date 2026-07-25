import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Building2, Save, X } from 'lucide-react';
import { useTenantsViewModel } from '../../hooks/useTenantsViewModel';
import { useUpdateTenantMutation } from '../../hooks/useTenantQueries';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { FormField, CheckboxField } from '../../components/common/ui/FormField';
import { TenantMonitorsPanel } from '../../components/settings/tenants/TenantMonitorsPanel';
import type { TenantResponseDto } from '@types';

function TenantDetailForm({ tenant, isAdmin, onBack }: { tenant: TenantResponseDto, isAdmin: boolean, onBack: () => void }) {
  const updateTenant = useUpdateTenantMutation();
  const { allMonitors, allUniqueTypes, allUniqueTags, assignMonitor, unassignMonitor } = useTenantsViewModel();
  
  const getInitialDraft = (t: TenantResponseDto) => ({
    name: t.name || '',
    litiumBaseUrl: t.litiumBaseUrl || '',
    imageUrl: t.imageUrl || '',
    serviceAccountToken: '',
    clearToken: false,
    orderFetchingEnabled: t.orderFetchingEnabled ?? false,
  });

  const [draft, setDraft] = useState(getInitialDraft(tenant));
  const lastTenantRef = useRef(tenant);

  useEffect(() => {
    setDraft(currentDraft => {
      const lastKnownDraft = getInitialDraft(lastTenantRef.current);
      const isCurrentlyDirty =
        currentDraft.name !== lastKnownDraft.name ||
        currentDraft.litiumBaseUrl !== lastKnownDraft.litiumBaseUrl ||
        currentDraft.imageUrl !== lastKnownDraft.imageUrl ||
        currentDraft.serviceAccountToken !== lastKnownDraft.serviceAccountToken ||
        currentDraft.clearToken !== lastKnownDraft.clearToken ||
        currentDraft.orderFetchingEnabled !== lastKnownDraft.orderFetchingEnabled;
        
      lastTenantRef.current = tenant;

      if (!isCurrentlyDirty) {
        return getInitialDraft(tenant);
      }
      return currentDraft;
    });
  }, [tenant]);

  const isDirty =
    draft.name !== (tenant.name || '') ||
    draft.litiumBaseUrl !== (tenant.litiumBaseUrl || '') ||
    draft.imageUrl !== (tenant.imageUrl || '') ||
    draft.serviceAccountToken !== '' ||
    draft.clearToken ||
    draft.orderFetchingEnabled !== (tenant.orderFetchingEnabled ?? false);

  const handleSave = () => {
    const payload: Partial<TenantResponseDto> & { serviceAccountToken?: string } = {};
    if (draft.name !== tenant.name) payload.name = draft.name;
    if (draft.litiumBaseUrl !== (tenant.litiumBaseUrl || '')) payload.litiumBaseUrl = draft.litiumBaseUrl;
    if (draft.imageUrl !== (tenant.imageUrl || '')) payload.imageUrl = draft.imageUrl;
    
    if (draft.clearToken) {
      payload.serviceAccountToken = '';
    } else if (draft.serviceAccountToken !== '') {
      payload.serviceAccountToken = draft.serviceAccountToken;
    }

    if (draft.orderFetchingEnabled !== (tenant.orderFetchingEnabled ?? false)) payload.orderFetchingEnabled = draft.orderFetchingEnabled;

    updateTenant.mutate(
      { id: tenant.id, payload },
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
    setDraft(getInitialDraft(tenant));
  };

  return (
    <>
        <SettingsPanelHeader
          title="Edit Tenant"
          subtitle={`Editing details for ${tenant.name}`}
          icon={<Building2 size={24} />}
          onBack={onBack}
        >
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!isDirty || updateTenant.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent disabled:hover:text-on-surface/[0.38]"
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || updateTenant.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-container px-4 text-sm font-bold text-on-primary-container transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38] disabled:hover:bg-on-surface/[0.1] disabled:hover:text-on-surface/[0.38]"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          )}
        </SettingsPanelHeader>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-2">
          
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface">Tenant Details</h3>
            <FormField
              id="tenant-name"
              label="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              disabled={!isAdmin}
            />

            <FormField
              id="tenant-litium-url"
              label="Litium Base URL"
              type="url"
              value={draft.litiumBaseUrl}
              onChange={(e) => setDraft({ ...draft, litiumBaseUrl: e.target.value })}
              disabled={!isAdmin}
            />

            <FormField
              id="tenant-image-url"
              label="Image URL"
              type="url"
              value={draft.imageUrl}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              disabled={!isAdmin}
            />

            <FormField
              id="tenant-token"
              label="Service Account Token"
              type="password"
              value={draft.serviceAccountToken}
              disabled={!isAdmin || draft.clearToken}
              onChange={(e) => setDraft({ ...draft, serviceAccountToken: e.target.value, clearToken: false })}
              placeholder={draft.clearToken ? 'Cleared' : (tenant.hasServiceAccountToken ? '•••••••••••• (Type to change)' : 'Type to set new token')}
              meta={(
                <span className="flex items-center gap-3">
                  {isAdmin && tenant.hasServiceAccountToken && !draft.clearToken && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, clearToken: true, serviceAccountToken: '' })}
                      className="cursor-pointer rounded-full px-3 py-1 text-sm font-bold text-error transition-colors hover:bg-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-error"
                    >
                      Clear Token
                    </button>
                  )}
                  <span className="text-xs italic text-on-surface-variant">
                    {draft.clearToken ? 'Pending clear' : tenant.hasServiceAccountToken ? 'Token is set' : 'Not set'}
                  </span>
                </span>
              )}
            />

            <CheckboxField
              id="tenant-fetching"
              label="Enable Order Fetching"
              checked={draft.orderFetchingEnabled}
              disabled={!isAdmin}
              onChange={e => setDraft({ ...draft, orderFetchingEnabled: e.target.checked })}
            />
          </div>

          <TenantMonitorsPanel
              tenantId={tenant.id}
              allMonitors={allMonitors}
              allUniqueTypes={allUniqueTypes}
              allUniqueTags={allUniqueTags}
              assignMonitor={assignMonitor.mutate}
              unassignMonitor={unassignMonitor.mutate}
              isAssignPending={assignMonitor.isPending}
              isUnassignPending={unassignMonitor.isPending}
              isAdmin={isAdmin}
          />
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
      <SettingsPanel className="flex-1">
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
