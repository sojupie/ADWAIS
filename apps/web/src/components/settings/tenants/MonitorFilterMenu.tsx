import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';

interface MonitorFilters {
  assignment: 'all' | 'assigned' | 'unassigned';
  tag: string;
}

interface MonitorFilterMenuProps {
  filters: MonitorFilters;
  setFilters: (filters: MonitorFilters) => void;
  tags: string[];
}

export function MonitorFilterMenu({ filters, setFilters, tags }: MonitorFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const activeCount = (filters.assignment !== 'all' ? 1 : 0) + (filters.tag !== 'all' ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const reset = () => setFilters({ assignment: 'all', tag: 'all' });

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`text-sm font-semibold border rounded-lg px-3 py-1.5 transition-colors focus:outline-none flex items-center gap-2 cursor-pointer ${activeCount > 0 ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
      >
        <Filter size={14} />
        Filters 
        {activeCount > 0 && <span className="bg-brand-accent text-white text-sm w-4 h-4 flex items-center justify-center rounded-full ml-1">{activeCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-[280px] bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex flex-col gap-5 z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Assignment</span>
              <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={filters.assignment === 'all'} 
                  onChange={e => setFilters({...filters, assignment: e.target.checked ? 'all' : 'assigned'})} 
                  className="rounded border-slate-300 w-3.5 h-3.5" 
                />
                All
              </label>
            </div>
            <div className={`flex items-center bg-slate-100 rounded-lg p-1 transition-opacity ${filters.assignment === 'all' ? 'opacity-70' : ''}`}>
              <button 
                onClick={() => setFilters({...filters, assignment: 'assigned'})} 
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.assignment === 'assigned' ? 'bg-white shadow-sm text-brand-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Assigned
              </button>
              <button 
                onClick={() => setFilters({...filters, assignment: 'unassigned'})} 
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.assignment === 'unassigned' ? 'bg-white shadow-sm text-brand-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Unassigned
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tag</span>
              <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={filters.tag === 'all'} 
                  onChange={e => setFilters({...filters, tag: e.target.checked ? 'all' : (tags[0] || 'all')})} 
                  className="rounded border-slate-300 w-3.5 h-3.5" 
                />
                All
              </label>
            </div>
            <select
              value={filters.tag}
              disabled={filters.tag === 'all'}
              onChange={e => setFilters({...filters, tag: e.target.value})}
              className={`text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-link/20 cursor-pointer text-slate-700 ${filters.tag === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="all">All Tags</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
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
