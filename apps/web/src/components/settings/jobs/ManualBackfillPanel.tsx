import { useState } from 'react';
import { Database, Play, ShieldAlert } from 'lucide-react';
import { SettingsCard } from '../../common/layout/SettingsCard';
import { SecureButton } from '../../common/ui/SecureButton';
import { Input } from '../../common/ui/Input';
import { Select } from '../../common/ui/Select';
import type { TenantResponseDto } from '@types';

interface ManualBackfillPanelProps {
  tenants: TenantResponseDto[] | undefined;
  triggerBackfill: {
    mutate: (variables: { tenantId: string; startDate: string; endDate: string }) => void;
    isPending: boolean;
  };
  disabled?: boolean;
}

export function ManualBackfillPanel({ tenants, triggerBackfill, disabled }: ManualBackfillPanelProps) {
  const [backfill, setBackfill] = useState({ tenantId: '', startDate: '', endDate: '' });

  const handleExecute = () => {
    if (disabled) return;
    triggerBackfill.mutate(backfill);
    setBackfill({ tenantId: '', startDate: '', endDate: '' });
  };

  return (
    <SettingsCard
      title="Historical Backfill"
      subtitle="Rebuild historical order data for a selected tenant and period."
      icon={<Database size={20} />}
    >
      <Select
            label="Tenant"
            value={backfill.tenantId}
            onChange={e => setBackfill({ ...backfill, tenantId: e.target.value })}
            disabled={disabled}
            size="lg"
        >
          <option value="" disabled>Select a tenant...</option>
          {(tenants || []).map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
          ))}
      </Select>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          label="Start Date"
          type="datetime-local"
          value={backfill.startDate}
          onChange={e => setBackfill({ ...backfill, startDate: e.target.value })}
          disabled={disabled}
          className={"bg-surface-container-lowest border border-outline"}
        />
        <Input
          label="End Date"
          type="datetime-local"
          value={backfill.endDate}
          onChange={e => setBackfill({ ...backfill, endDate: e.target.value })}
          disabled={disabled}
          className={"bg-surface-container-lowest border border-outline"}
        />
      </div>
      <SecureButton
        onClick={handleExecute}
        locked={disabled}
        lockTitle="Requires Admin privileges"
        loading={triggerBackfill.isPending}
        loadingText="Initiating..."
        icon={<Play size={16} />}
        className="mt-2 flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        disabled={!backfill.tenantId}
      >
        Execute Backfill
      </SecureButton>
      <div className="flex items-start gap-3 rounded-xl bg-error-container p-4 text-on-error-container">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium leading-5">
          Large backfills may be rate limited and temporarily slow reporting while monitoring views are rebuilt.
        </p>
      </div>
    </SettingsCard>
  );
}
