import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';

interface TenantFilters {
  token: string;
  fetch: string;
}

interface TenantFilterMenuProps {
  filters: TenantFilters;
  setFilters: (filters: TenantFilters) => void;
}

export function TenantFilterMenu({ filters, setFilters }: TenantFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCount = (filters.token !== 'all' ? 1 : 0) + (filters.fetch !== 'all' ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const reset = () => setFilters({ token: 'all', fetch: 'all' });

  return (
    <div className="relative bg-surface border rounded-lg" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-sm font-semibold border rounded-lg px-3 py-1.5 transition-colors focus:outline-none flex items-center gap-2 cursor-pointer h-9 ${activeCount > 0 ? 'bg-brand-accent/15 border-brand-accent/20hover:bg-surface-container-low' : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <Filter size={14} />
        <span>Filters</span>
        {activeCount > 0 && <span className="bg-brand-accent text-sm w-4 h-4 flex items-center justify-center rounded-full ml-1">{activeCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-[280px] bg-surface border border-outline-variant shadow-xl rounded-xl p-4 flex flex-col gap-10 z-50 animate-in fade-in slide-in-from-top-2">

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Service Token</span>
              <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={filters.token === 'all'} onChange={e => setFilters({ ...filters, token: e.target.checked ? 'all' : 'set' })} className="rounded border-outline-variant w-3.5 h-3.5" />
                All
              </label>
            </div>
            <div className={`flex items-center bg-surface-container rounded-lg p-1 transition-opacity ${filters.token === 'all' ? 'opacity-70' : ''}`}>
              <button
                onClick={() => setFilters({ ...filters, token: 'set' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.token === 'set' ? 'bg-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
              >
                Set
              </button>
              <button
                onClick={() => setFilters({ ...filters, token: 'missing' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.token === 'missing' ? 'bg-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
              >
                Missing
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Order Fetching</span>
              <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={filters.fetch === 'all'} onChange={e => setFilters({ ...filters, fetch: e.target.checked ? 'all' : 'on' })} className="rounded border-outline-variant w-3.5 h-3.5" />
                All
              </label>
            </div>
            <div className={`flex items-center bg-surface-container rounded-lg p-1 transition-opacity ${filters.fetch === 'all' ? 'opacity-70' : ''}`}>
              <button
                onClick={() => setFilters({ ...filters, fetch: 'on' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.fetch === 'on' ? 'bg-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
              >
                Enabled
              </button>
              <button
                onClick={() => setFilters({ ...filters, fetch: 'off' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.fetch === 'off' ? 'bg-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
              >
                Disabled
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant flex justify-end">
            <button
              onClick={reset}
              disabled={activeCount === 0}
              className="text-sm font-bold text-on-surface-variant bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
