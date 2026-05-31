import { useState } from 'react';
import { Play, Pause, Link2, Unlink2, X } from 'lucide-react';
import type { UptimeMonitorDto, TenantResponseDto } from '@types';
import { TileCard } from '../../common/layout/TileCard';
import { TileSaveBar } from '../../common/ui/TileSaveBar';

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function normalizeStatus(status?: string | number): string {
  if (status === undefined || status === null) return 'UNKNOWN';
  const s = status.toString().toUpperCase().trim();
  if (s === '2' || s === 'UP') return 'UP';
  if (s === '8' || s === '9' || s === 'DOWN' || s === 'SEEMS DOWN' || s === 'CRITICAL') return 'DOWN';
  if (s === '0' || s === 'PAUSED') return 'PAUSED';
  return 'UNKNOWN';
}

interface MonitorTileProps {
  m: UptimeMonitorDto;
  updateMonitor: {
    mutate: (variables: { id: number; payload: Partial<UptimeMonitorDto> }) => void;
    isPending: boolean;
  };
  toggleMonitor: {
    mutate: (variables: { id: number; action: 'start' | 'pause' }) => void;
  };
  assignMonitor: {
    mutate: (variables: { id: number; tenantId: string }) => void;
  };
  unassignMonitor: {
    mutate: (id: number) => void;
  };
  tenants: TenantResponseDto[] | undefined;
  isAssigning: boolean;
  setAssigningMonitorId: (id: number | null) => void;
  assignTenantId: string;
  setAssignTenantId: (id: string) => void;
}

export function MonitorTile({
  m,
  updateMonitor,
  toggleMonitor,
  assignMonitor,
  unassignMonitor,
  tenants,
  isAssigning,
  setAssigningMonitorId,
  assignTenantId,
  setAssignTenantId
}: MonitorTileProps) {
  const isUnassigned = !m.tenantId || m.tenantId === SYSTEM_TENANT_ID;

  const [draft, setDraft] = useState({
    name: m.name || '',
    url: m.url || ''
  });

  const isDirty = draft.name !== (m.name || '') || draft.url !== (m.url || '');

  const handleSave = () => {
    const payload: Partial<UptimeMonitorDto> = {};
    if (draft.name !== (m.name || '')) payload.name = draft.name;
    if (draft.url !== (m.url || '')) payload.url = draft.url;
    updateMonitor.mutate({ id: m.id, payload });
  };

  const handleCancel = () => {
    setDraft({
      name: m.name || '',
      url: m.url || ''
    });
  };

  const assignableTenants = (tenants || []).filter(t => t.id !== SYSTEM_TENANT_ID);

  const header = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2 w-2 shrink-0">
          {normalizeStatus(m.currentStatus) === 'UP' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${normalizeStatus(m.currentStatus) === 'UP' ? 'bg-green-500' : normalizeStatus(m.currentStatus) === 'DOWN' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
        </span>
        <input
          value={draft.name}
          onChange={e => setDraft({...draft, name: e.target.value})}
          className="font-extrabold text-slate-800 text-sm bg-transparent hover:bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-link/20 border border-transparent hover:border-slate-300 focus:border-brand-link/30 rounded px-1 -ml-1 transition-all w-full outline-none truncate"
          placeholder="Monitor Name"
        />
      </div>
      {isUnassigned ? (
        <span className="text-xs uppercase font-bold text-orange-500 tracking-wide flex items-center gap-1"><Unlink2 size={10} /> Unassigned</span>
      ) : (
        <span className="text-xs uppercase font-bold text-brand-link tracking-wide flex items-center gap-1"><Link2 size={10} /> Assigned</span>
      )}
    </>
  );

  const headerActions = m.uptimeMonitorEnabled ? (
    <button onClick={() => toggleMonitor.mutate({ id: m.id, action: 'pause' })} className="p-1.5 text-slate-500 hover:bg-slate-200 bg-white rounded-lg transition-colors cursor-pointer shadow-sm animate-in fade-in" title="Pause Monitor"><Pause size={14} /></button>
  ) : (
    <button onClick={() => toggleMonitor.mutate({ id: m.id, action: 'start' })} className="p-1.5 text-green-600 hover:bg-green-100 bg-white rounded-lg transition-colors cursor-pointer shadow-sm animate-in fade-in" title="Resume Monitor"><Play size={14} /></button>
  );

  return (
    <TileCard header={header} headerActions={headerActions} isUnassigned={isUnassigned}>
      <div className="flex flex-col gap-1 group">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target URL</label>
        <input
          value={draft.url}
          onChange={e => setDraft({...draft, url: e.target.value})}
          className="text-sm font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-link/20 border border-transparent hover:border-slate-200 focus:border-brand-link/30 rounded px-2 py-1 -ml-2 transition-all outline-none"
          placeholder="https://..."
        />
      </div>

      <TileSaveBar
        isDirty={isDirty}
        isPending={updateMonitor.isPending}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        {isUnassigned || isAssigning ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in">
            <input
              list={`tenants-${m.id}`}
              value={assignTenantId}
              onChange={e => setAssignTenantId(e.target.value)}
              placeholder="Search for tenant name..."
              className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-brand-link focus:outline-none"
            />
            <datalist id={`tenants-${m.id}`}>
              {assignableTenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </datalist>
            <button onClick={() => { if(assignTenantId) assignMonitor.mutate({ id: m.id, tenantId: assignTenantId }); }} disabled={!assignTenantId} className="px-3 py-1.5 bg-brand-link text-white font-bold rounded-lg text-xs hover:bg-brand-link/90 transition-colors disabled:opacity-50 cursor-pointer shadow-sm">Link</button>
            <button onClick={() => { setAssigningMonitorId(null); setAssignTenantId(''); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={14}/></button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex flex-col gap-0.5 min-w-0">
              Linked to
              <span className="text-sm text-slate-700 font-mono font-semibold truncate max-w-[150px] select-text cursor-text">{(tenants || []).find((t) => t.id === m.tenantId)?.name || m.tenantName || m.tenantId}</span>
            </span>
            <div className="flex gap-2 ml-2">
              <button onClick={() => setAssigningMonitorId(m.id)} className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-sm">
                Reassign
              </button>
              <button onClick={() => { if(confirm('Unassign monitor?')) unassignMonitor.mutate(m.id); }} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-100 shadow-sm">
                Unassign
              </button>
            </div>
          </div>
        )}
      </div>
    </TileCard>
  );
}
