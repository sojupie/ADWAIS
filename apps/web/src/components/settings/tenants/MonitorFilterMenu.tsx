import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';
import { Select } from '../../common/ui/Select';

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
    <div className="relative bg-surface border-brand-accent rounded-lg" ref={ref}>
      <button
          onClick={() => setIsOpen(!isOpen)}
          className={`text-sm bg-surface-container-high font-semibold border rounded-lg px-3 py-1.5 transition-colors focus:outline-none flex items-center gap-2 cursor-pointer h-9 ${activeCount > 0 ? 'border-brand-accent bg-surface hover:bg-surface-container-low' : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
      >
        <Filter size={14} />
        <span>Filters</span>
        {activeCount > 0 && <span className="bg-brand-accent text-sm w-4 h-4 flex items-center justify-center rounded-full ml-1">{activeCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-[280px] bg-surface border border-outline-variant shadow-xl rounded-xl p-4 flex flex-col gap-10 z-50 animate-in fade-in slide-in-from-top-2">

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Assignment</span>
              <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.assignment === 'all'}
                  onChange={e => setFilters({ ...filters, assignment: e.target.checked ? 'all' : 'assigned' })}
                  className="rounded border-outline-variant w-3.5 h-3.5"
                />
                All
              </label>
            </div>
            <div className={`flex items-center bg-surface-container rounded-lg p-1 transition-opacity ${filters.assignment === 'all' ? 'opacity-70' : ''}`}>
              <button
                onClick={() => setFilters({ ...filters, assignment: 'assigned' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.assignment === 'assigned' ? 'bg-surface shadow-sm text-on-surface-variant' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
              >
                Assigned
              </button>
              <button
                onClick={() => setFilters({ ...filters, assignment: 'unassigned' })}
                className={`flex-1 py-1 text-sm font-bold uppercase rounded-md transition-all cursor-pointer ${filters.assignment === 'unassigned' ? 'bg-surface shadow-sm text-on-surface-variant' : 'text-on-surface-variant hover:text-on-surface-variant'}`}
              >
                Unassigned
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Tag</span>
              <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.tag === 'all'}
                  onChange={e => setFilters({ ...filters, tag: e.target.checked ? 'all' : (tags[0] || 'all') })}
                  className="rounded border-outline-variant w-3.5 h-3.5"
                />
                All
              </label>
            </div>
            <Select
                value={filters.tag}
                disabled={filters.tag === 'all'}
                onChange={e => setFilters({ ...filters, tag: e.target.value })}
                variant="outlined"
                size="sm"
            >
              <option value="all">All Tags</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </Select>
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
