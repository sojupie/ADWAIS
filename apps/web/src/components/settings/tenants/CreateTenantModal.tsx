import { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { FormField } from '../../common/ui/FormField';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  createTenant: {
    mutate: (tenant: { name: string; litiumBaseUrl: string; imageUrl: string; serviceAccountToken: string; }, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
}

export function CreateTenantModal({ isOpen, onClose, createTenant }: CreateTenantModalProps) {
  const [draft, setDraft] = useState({ name: '', litiumBaseUrl: '', imageUrl: '', serviceAccountToken: '' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenant.mutate(draft, {
      onSuccess: () => {
        setDraft({ name: '', litiumBaseUrl: '', imageUrl: '', serviceAccountToken: '' });
        onClose();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in"
      role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="m3-elevation-4 flex w-full max-w-md flex-col overflow-hidden rounded-3xl border-0 bg-surface animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tenant-title"
      >
        <div className="flex items-center justify-between bg-surface px-6 py-5">
          <h3 id="create-tenant-title" className="flex items-center gap-4 text-xl font-bold text-on-surface">
            <Building2 size={20} className="text-on-surface-variant" aria-hidden="true" />
            Create tenant
          </h3>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4 bg-surface px-6 pb-6">
          <p className="text-sm font-medium text-on-surface-variant mb-2">
            Connect a commerce environment to the dashboard.
          </p>

          <FormField
            id="tenant-name"
            label="Name"
            type="text"
            placeholder="Tenant Name"
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            required
          />

          <FormField
            id="tenant-url"
            label="Litium Base URL"
            type="url"
            placeholder="https://example.com"
            value={draft.litiumBaseUrl}
            onChange={e => setDraft({ ...draft, litiumBaseUrl: e.target.value })}
            required
          />

          <FormField
            id="tenant-image"
            label="Image URL (optional)"
            type="url"
            placeholder="https://example.com/logo.png"
            value={draft.imageUrl}
            onChange={e => setDraft({ ...draft, imageUrl: e.target.value })}
          />

          <FormField
            id="tenant-token"
            label="Service Account Token"
            type="password"
            placeholder="Secret Token"
            value={draft.serviceAccountToken}
            onChange={e => setDraft({ ...draft, serviceAccountToken: e.target.value })}
            className="font-mono"
          />
        </div>

        <div className="flex justify-end gap-3 bg-surface px-6 py-4">
          <button type="button" onClick={onClose} disabled={createTenant.isPending} className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-base font-bold transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:text-on-surface/[0.38] disabled:hover:bg-transparent">
            Cancel
          </button>
          <button type="submit" disabled={!draft.name || !draft.litiumBaseUrl || createTenant.isPending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38] disabled:hover:bg-on-surface/[0.1] disabled:hover:text-on-surface/[0.38]">
            {createTenant.isPending ? 'Creating...' : 'Create tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}
