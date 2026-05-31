import { useState } from 'react';
import { Database, Play, ShieldAlert } from 'lucide-react';
import { SettingsCard } from '../../common/layout/SettingsCard';
import type { TenantResponseDto } from '@types';

interface ManualBackfillPanelProps {
  tenants: TenantResponseDto[] | undefined;
  triggerBackfill: {
    mutate: (variables: { tenantId: string; startDate: string; endDate: string }) => void;
    isPending: boolean;
  };
}

export function ManualBackfillPanel({ tenants, triggerBackfill }: ManualBackfillPanelProps) {
  const [backfill, setBackfill] = useState({ tenantId: '', startDate: '', endDate: '' });

  const handleExecute = () => {
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
        <select
          value={backfill.tenantId}
          onChange={e => setBackfill({ ...backfill, tenantId: e.target.value })}
          className="bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-lg text-sm flex-1 focus:ring-2 focus:ring-brand-link focus:outline-none cursor-pointer"
        >
          <option value="" disabled>Select a tenant...</option>
          {(tenants || []).map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.type === 2 ? 'Sandbox' : 'Production'})</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-1 block uppercase tracking-wider">Start Date</label>
          <input
            type="datetime-local"
            value={backfill.startDate}
            onChange={e => setBackfill({ ...backfill, startDate: e.target.value })}
            className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-link focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-1 block uppercase tracking-wider">End Date</label>
          <input
            type="datetime-local"
            value={backfill.endDate}
            onChange={e => setBackfill({ ...backfill, endDate: e.target.value })}
            className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-link focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={handleExecute}
        disabled={!backfill.tenantId || triggerBackfill.isPending}
        className="bg-brand-link hover:bg-brand-link/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 mt-2 w-full"
      >
        <Play size={16} /> {triggerBackfill.isPending ? 'Initiating...' : 'Execute Backfill'}
      </button>
      <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
        <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 font-medium leading-relaxed">
          Long backfills require multiple GET requests for pagination that are likely to get rate limited (although automatically managed by back-off and retry policies). <br />Triggering a backfill also drops existing materialized views. Expect performance degradation.
        </p>
      </div>
    </SettingsCard>
  );
}
