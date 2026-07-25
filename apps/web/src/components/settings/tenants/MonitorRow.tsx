import { Activity, CheckCircle2, XCircle, Globe, Gauge } from 'lucide-react';
import type { UptimeMonitorDto } from '@types';

interface MonitorRowProps {
  m: UptimeMonitorDto;
  selected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
}

export function MonitorRow({ m, selected = false, onSelect, onDoubleClick }: MonitorRowProps) {
  return (
    <tr 
      className={`group transition-colors hover:bg-surface-container-low cursor-pointer select-none ${selected ? 'bg-primary-container/10' : ''}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <td className="w-12 px-4 py-3 align-middle sm:px-5">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={(e) => { e.stopPropagation(); onSelect?.(); }}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5 rounded border-outline-variant text-secondary focus:ring-2 focus:ring-secondary/40 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 align-middle sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
             <Activity size={20} />
          </div>
          <div className="flex flex-col w-full max-w-[250px]">
            <span className="text-base font-bold text-on-surface truncate">{m.name || 'Unnamed Monitor'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle sm:px-5 text-sm font-medium text-on-surface-variant truncate max-w-[250px]">
        {m.url || 'N/A'}
      </td>
      <td className="w-32 px-4 py-3 align-middle sm:px-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
            {m.type === 'Ping' ? <Globe size={12} /> : <Gauge size={12} />}
            {m.type}
        </span>
      </td>
      <td className="w-32 px-4 py-3 align-middle sm:px-5">
        <span className="text-sm font-bold text-on-surface-variant">
            {m.tenantId ? 'Assigned' : 'Unassigned'}
        </span>
      </td>
      <td className="w-32 px-4 py-3 align-middle sm:px-5">
        <span className={`inline-flex items-center gap-1.5 rounded-full text-sm font-bold ${
          m.uptimeMonitorEnabled ? 'bg-success-container text-on-success-container' : 'bg-surface-container text-on-surface-variant'
        }`}>
          {m.uptimeMonitorEnabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {m.uptimeMonitorEnabled ? 'Enabled' : 'Paused'}
        </span>
      </td>
    </tr>
  );
}
