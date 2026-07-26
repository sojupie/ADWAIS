import { Building2, CheckCircle2, XCircle } from 'lucide-react';
import type { TenantResponseDto } from '@types';

interface TenantRowProps {
  t: TenantResponseDto;
  selected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
}

export function TenantRow({ t, selected = false, onSelect, onDoubleClick }: TenantRowProps) {
  return (
    <tr 
      className={`group transition-colors bg-surface border-b border-outline-variant hover:bg-surface-container cursor-pointer select-none ${selected ? 'bg-primary-container/10' : ''}`}
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container overflow-hidden">
            {t.imageUrl ? (
                <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover" />
            ) : (
                <Building2 size={20} />
            )}
          </div>
          <div className="flex flex-col w-full max-w-[250px]">
            <span className="text-base font-bold text-on-surface truncate">{t.name || 'Unnamed Tenant'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle sm:px-5 text-sm font-bold text-on-surface-variant truncate max-w-[250px]">
        {t.litiumBaseUrl || 'N/A'}
      </td>
      <td className="w-32 px-4 py-3 align-middle sm:px-5">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
          t.orderFetchingEnabled ? 'bg-success-container text-on-success-container' : 'bg-surface-container text-on-surface-variant'
        }`}>
          {t.orderFetchingEnabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {t.orderFetchingEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td className="w-32 px-4 py-3 align-middle sm:px-5">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
          t.hasServiceAccountToken ? 'bg-success-container text-on-success-container' : 'bg-surface-container text-on-surface-variant'
        }`}>
          {t.hasServiceAccountToken ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {t.hasServiceAccountToken ? 'Token Set' : 'Missing Token'}
        </span>
      </td>
    </tr>
  );
}
