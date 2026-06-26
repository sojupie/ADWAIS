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
    <div className="relative bg-white border rounded-lg" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-sm font-semibold border rounded-lg px-3 py-1.5 transition-colors focus:outline-none flex items-center gap-1 cursor-pointer h-9 ${activeCount > 0 ? 'bg-brand-accent/15 border-brand-accent/20hover:bg-slate-50' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-50'}`}
      >
        <Filter size={14} />
        <span>Filters</span>
        {activeCount > 0 && <span className="bg-brand-accent text-sm w-4 h-4 flex items-center justify-center rounded-full ml-1">{activeCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-[280px] bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex flex-col gap-5 z-50 animate-in fade-in slide-in-from-top-2">

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Service Token</span>
              <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={filters.token === 'all'} onChange={e => setFilters({ ...filters, token: e.target.checked ? 'all' : 'set' })} className="rounded border-slate-300 w-3.5 h-3.5" />
                All
              </label>
            </div>
            <div className={`flex items-center bg-slate-100 rounded-lg p-1 transition-opacity ${filters.token === 'all' ? 'opacity-70' : ''}`}>
              <button
                onClick={() => setFilters({ ...filters, token: 'set' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.token === 'set' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Set
              </button>
              <button
                onClick={() => setFilters({ ...filters, token: 'missing' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.token === 'missing' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Missing
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Order Fetching</span>
              <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={filters.fetch === 'all'} onChange={e => setFilters({ ...filters, fetch: e.target.checked ? 'all' : 'on' })} className="rounded border-slate-300 w-3.5 h-3.5" />
                All
              </label>
            </div>
            <div className={`flex items-center bg-slate-100 rounded-lg p-1 transition-opacity ${filters.fetch === 'all' ? 'opacity-70' : ''}`}>
              <button
                onClick={() => setFilters({ ...filters, fetch: 'on' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.fetch === 'on' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Enabled
              </button>
              <button
                onClick={() => setFilters({ ...filters, fetch: 'off' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.fetch === 'off' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Disabled
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={reset}
              disabled={activeCount === 0}
              className="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
