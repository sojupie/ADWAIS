import { useState } from 'react';
import { Play, Pause, Link2, Unlink2, X, Lock } from 'lucide-react';
import type { UptimeMonitorDto, TenantResponseDto, UpdateMonitorRequestDto } from '@types';
import { TileCard } from '../../common/layout/TileCard';
import { TileSaveBar } from '../../common/ui/TileSaveBar';
import { useUpdateMonitorMutation } from '../../../hooks/useMonitorQueries';
import { Input } from '../../common/ui/Input';
import { SecureButton } from '../../common/ui/SecureButton';
import { Select } from '../../common/ui/Select';
import { getMonitorType, UPTIME_MONITOR_TYPES } from '../../../utils/monitorTypeHelper';

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
  toggleMonitor: {
    mutate: (variables: { id: number; action: 'start' | 'pause' }) => void;
  };
  assignMonitor: {
    mutate: (variables: { id: number; tenantId: string }) => void;
    isPending?: boolean;
  };
  unassignMonitor: {
    mutate: (id: number) => void;
    isPending?: boolean;
  };
  tenants: TenantResponseDto[] | undefined;
  isAssigning: boolean;
  setAssigningMonitorId: (id: number | null) => void;
  assignTenantId: string;
  setAssignTenantId: (id: string) => void;
  isAdmin?: boolean;
}

export function MonitorTile({
  m,
  toggleMonitor,
  assignMonitor,
  unassignMonitor,
  tenants,
  isAssigning,
  setAssigningMonitorId,
  assignTenantId,
  setAssignTenantId,
  isAdmin = false
}: MonitorTileProps) {
  const updateMonitor = useUpdateMonitorMutation();
  const isUnassigned = !m.tenantId || m.tenantId === SYSTEM_TENANT_ID;

  const [draft, setDraft] = useState<{
    name: string;
    url: string;
    type: string;
    uptimeSla: number | '';
    tags: string[];
  }>({
    name: m.name || '',
    url: m.url || '',
    type: getMonitorType(m.type),
    uptimeSla: m.uptimeSla ?? '',
    tags: m.tags || []
  });

  const [tagInput, setTagInput] = useState('');

  const tagsEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };

  const isDirty =
    draft.name !== (m.name || '') ||
    draft.url !== (m.url || '') ||
    draft.type !== getMonitorType(m.type) ||
    draft.uptimeSla !== (m.uptimeSla ?? '') ||
    !tagsEqual(draft.tags, m.tags || []);

  const handleSave = () => {
    const payload: UpdateMonitorRequestDto = {};
    if (draft.name !== (m.name || '')) payload.name = draft.name;
    if (draft.url !== (m.url || '')) payload.url = draft.url;
    if (draft.type !== getMonitorType(m.type)) payload.type = draft.type;
    if (draft.uptimeSla !== (m.uptimeSla ?? '')) {
      payload.sla = draft.uptimeSla === '' ? null : Number(draft.uptimeSla);
    }
    if (!tagsEqual(draft.tags, m.tags || [])) {
      payload.tags = draft.tags;
    }
    
    updateMonitor.mutate(
      { id: m.id, payload },
      {
        onSuccess: () => {
          setTimeout(() => {
            updateMonitor.reset();
          }, 3000);
        }
      }
    );
  };

  const handleCancel = () => {
    setDraft({
      name: m.name || '',
      url: m.url || '',
      type: getMonitorType(m.type),
      uptimeSla: m.uptimeSla ?? '',
      tags: m.tags || []
    });
    setTagInput('');
  };

  const assignableTenants = (tenants || []).filter(t => t.id !== SYSTEM_TENANT_ID);

  const header = (
    <>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className="relative flex h-2 w-2 shrink-0">
          {normalizeStatus(m.currentStatus) === 'UP' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${normalizeStatus(m.currentStatus) === 'UP' ? 'bg-green-500' : normalizeStatus(m.currentStatus) === 'DOWN' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
        </span>
        <input
          value={draft.name}
          onChange={e => setDraft({...draft, name: e.target.value})}
          disabled={!isAdmin}
          className={`font-extrabold text-on-surface text-sm bg-transparent border border-transparent rounded px-1 -ml-1 transition-all w-full outline-none truncate ${
            isAdmin ? 'hover:bg-surface/50 focus:bg-surface focus:ring-2 focus:ring-brand-link/20 hover:border-outline-variant focus:border-brand-link/30' : 'cursor-not-allowed text-slate-550'
          }`}
          placeholder="Monitor Name"
        />
      </div>
      {isUnassigned ? (
        <span className="text-sm uppercase font-bold text-orange-500 tracking-wide flex items-center gap-2 shrink-0"><Unlink2 size={10} /> Unassigned</span>
      ) : (
        <span className="text-sm uppercase font-bold text-brand-link tracking-wide flex items-center gap-2 shrink-0"><Link2 size={10} /> Assigned</span>
      )}
    </>
  );

  const headerActions = !isAdmin ? (
    <span className="p-1.5 text-on-surface-variant opacity-60 cursor-not-allowed ml-2" title="Requires Admin privileges">
      <Lock size={14} />
    </span>
  ) : m.uptimeMonitorEnabled ? (
    <button onClick={() => toggleMonitor.mutate({ id: m.id, action: 'pause' })} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high bg-surface rounded-lg transition-colors cursor-pointer shadow-sm" title="Pause Monitor"><Pause size={14} /></button>
  ) : (
    <button onClick={() => toggleMonitor.mutate({ id: m.id, action: 'start' })} className="p-1.5 text-green-600 hover:bg-green-100 bg-surface rounded-lg transition-colors cursor-pointer shadow-sm" title="Resume Monitor"><Play size={14} /></button>
  );

  return (
    <TileCard header={header} headerActions={headerActions} isUnassigned={isUnassigned}>
      <div className="flex flex-col gap-2 group">
        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Target URL</label>
        <input
          value={draft.url}
          onChange={e => setDraft({...draft, url: e.target.value})}
          disabled={!isAdmin}
          className={`text-sm font-semibold text-on-surface bg-transparent border border-transparent rounded px-2 py-1 -ml-2 transition-all outline-none ${
            isAdmin ? 'hover:bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-brand-link/20 hover:border-outline-variant focus:border-brand-link/30' : 'cursor-not-allowed text-on-surface-variant'
          }`}
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-8 mt-2">
        <Select
          label="Monitor Type"
          value={draft.type}
          onChange={e => setDraft({ ...draft, type: e.target.value })}
          disabled={!isAdmin}
          size="sm"
          containerClassName="flex-1"
        >
          {!UPTIME_MONITOR_TYPES.includes(draft.type as typeof UPTIME_MONITOR_TYPES[number]) && (
            <option value={draft.type}>{draft.type}</option>
          )}
          {UPTIME_MONITOR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Uptime SLA (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={draft.uptimeSla}
            onChange={e => setDraft({...draft, uptimeSla: e.target.value === '' ? '' : Number(e.target.value)})}
            disabled={!isAdmin}
            className={`text-sm font-semibold text-on-surface bg-transparent border border-transparent rounded px-2 py-1 -ml-2 transition-all outline-none ${
              isAdmin ? 'hover:bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-brand-link/20 hover:border-outline-variant focus:border-brand-link/30' : 'cursor-not-allowed text-on-surface-variant'
            }`}
            placeholder="e.g. 99.5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Tags</label>
        <div className="flex flex-wrap gap-2 mb-1.5 items-center">
          {draft.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-surface-container border border-outline-variant text-on-surface-variant flex items-center gap-2"
            >
              {tag}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, tags: draft.tags.filter(t => t !== tag) })}
                  className="hover:text-red-600 focus:outline-none ml-0.5 cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
        {isAdmin && (
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const trimmed = tagInput.trim().toUpperCase();
                if (trimmed && !draft.tags.includes(trimmed)) {
                  setDraft({ ...draft, tags: [...draft.tags, trimmed] });
                  setTagInput('');
                }
              }
            }}
            className="text-sm font-semibold text-on-surface bg-transparent hover:bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-brand-link/20 border border-transparent hover:border-outline-variant focus:border-brand-link/30 rounded px-2 py-1 -ml-2 transition-all outline-none"
            placeholder="+ Add tag (Press Enter)"
          />
        )}
      </div>

      {isAdmin && (
        <TileSaveBar
          isDirty={isDirty}
          isPending={updateMonitor.isPending}
          isSuccess={updateMonitor.isSuccess}
          isError={updateMonitor.isError}
          errorMsg={updateMonitor.error ? (updateMonitor.error instanceof Error ? updateMonitor.error.message : String(updateMonitor.error)) : null}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="pt-3 border-t border-outline-variant flex items-center justify-between">
        {!isAdmin ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide flex flex-col gap-1 min-w-0">
              Linked to
              <span className="text-sm text-on-surface-variant font-mono font-semibold truncate max-w-[250px] select-text cursor-text">
                {isUnassigned ? 'Unassigned' : ((tenants || []).find((t) => t.id === m.tenantId)?.name || m.tenantName || m.tenantId)}
              </span>
            </span>
            <span className="p-1 text-on-surface-variant opacity-60 cursor-not-allowed flex items-center gap-2" title="Requires Admin privileges">
              <Lock size={12} />
              <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Admin Only</span>
            </span>
          </div>
        ) : isUnassigned || isAssigning ? (
          <div className="flex items-center gap-4 w-full items-end">
            <Input
              list={`tenants-${m.id}`}
              value={assignTenantId}
              onChange={e => setAssignTenantId(e.target.value)}
              placeholder="Search for tenant..."
              containerClassName="flex-1"
              className="px-2 py-1.5 text-sm h-8 rounded-lg"
            />
            <datalist id={`tenants-${m.id}`}>
              {assignableTenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </datalist>
            <SecureButton
              onClick={() => { if(assignTenantId) assignMonitor.mutate({ id: m.id, tenantId: assignTenantId }); }}
              disabled={!assignTenantId}
              loading={assignMonitor.isPending}
              className="px-3 py-1.5 bg-brand-link text-white font-bold rounded-lg text-sm hover:bg-brand-link/90 transition-colors cursor-pointer shadow-sm h-8 flex items-center justify-center shrink-0"
            >
              Link
            </SecureButton>
            <button onClick={() => { setAssigningMonitorId(null); setAssignTenantId(''); }} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer h-8 flex items-center justify-center shrink-0"><X size={14}/></button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide flex flex-col gap-1 min-w-0">
              Linked to
              <span className="text-sm text-on-surface-variant font-mono font-semibold truncate max-w-[150px] select-text cursor-text">{(tenants || []).find((t) => t.id === m.tenantId)?.name || m.tenantName || m.tenantId}</span>
            </span>
            <div className="flex gap-4 ml-2">
              <SecureButton
                onClick={() => setAssigningMonitorId(m.id)}
                locked={!isAdmin}
                className="text-sm font-bold text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-outline-variant shadow-sm flex items-center justify-center gap-3"
              >
                Reassign
              </SecureButton>
              <SecureButton
                onClick={() => { if(confirm('Unassign monitor?')) unassignMonitor.mutate(m.id); }}
                locked={!isAdmin}
                loading={unassignMonitor.isPending}
                className="text-sm font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-100 shadow-sm flex items-center justify-center gap-3"
              >
                Unassign
              </SecureButton>
            </div>
          </div>
        )}
      </div>
    </TileCard>
  );
}
