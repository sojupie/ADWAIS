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
      subtitle="Force massive data ingestion"
      icon={<Database size={20} />}
    >
      <div className="flex gap-3">
        <Select
          value={backfill.tenantId}
          onChange={e => setBackfill({ ...backfill, tenantId: e.target.value })}
          disabled={disabled}
        >
          <option value="" disabled>Select a tenant...</option>
          {(tenants || []).map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
          ))}
        </Select>
      </div>
      <div className="flex gap-3">
        <Input
          label="Start Date"
          type="datetime-local"
          value={backfill.startDate}
          onChange={e => setBackfill({ ...backfill, startDate: e.target.value })}
          disabled={disabled}
        />
        <Input
          label="End Date"
          type="datetime-local"
          value={backfill.endDate}
          onChange={e => setBackfill({ ...backfill, endDate: e.target.value })}
          disabled={disabled}
        />
      </div>
      <SecureButton
        onClick={handleExecute}
        locked={disabled}
        lockTitle="Requires Admin privileges"
        loading={triggerBackfill.isPending}
        loadingText="Initiating..."
        icon={<Play size={16} />}
        className="text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 w-full bg-brand-link hover:bg-brand-link/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!backfill.tenantId}
      >
        Execute Backfill
      </SecureButton>
      <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
        <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 font-medium leading-relaxed">
          Long backfills require multiple GET requests for pagination that are likely to get rate limited (although automatically managed by back-off and retry policies). <br />Triggering a backfill also drops existing materialized views. Expect performance degradation.
        </p>
      </div>
    </SettingsCard>
  );
}
