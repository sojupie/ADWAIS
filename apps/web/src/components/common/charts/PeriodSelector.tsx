import { useNavigate, useSearch } from '@tanstack/react-router';
import { type PersistentDomain, setSavedTimeframe } from "../../../utils/timeframeStorage";
import type { Timeframe } from '../../../schemas';

interface PeriodSelectorProps {
  from: PersistentDomain;
}

export function PeriodSelector({ from }: PeriodSelectorProps ) {
  const navigate = useNavigate({ from });
  // Reactively subscribe to the current search parameters so the active button updates
  const search = useSearch({ strict: false });
  const timeframe = search.timeframe;

  const options = [
    { label: '1D', value: 'Today' },
    { label: '7D', value: 'T7' },
    { label: '30D', value: 'T30' },
    { label: '90D', value: 'T90' },
    { label: '365D', value: 'T365' },
    { label: 'YTD', value: 'Ytd' },
  ] as const;

  const handleSelect = (val: Timeframe) => {
    setSavedTimeframe(from, val);
    void navigate({ search: (old: Record<string, unknown>) => ({ ...old, timeframe: val }) });
  };

  return (
    <div className="group grid grid-cols-3 gap-1 md:flex md:gap-1 bg-brand-bg-secondary p-1.5 rounded-xl md:rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-brand-bg-secondary/10 pointer-events-auto w-full md:w-auto max-w-[400px] md:max-w-none transition-all duration-350 ease-out">
      {options.map((opt) => {
        const isActive = timeframe === opt.value;
        return (
          <button
            key={opt.value}
            id={`period-${opt.value}`}
            onClick={() => handleSelect(opt.value)}
            className={`px-2 py-2 md:px-5 text-xs font-black rounded-full transition-all duration-300 tracking-widest uppercase cursor-pointer text-center
              ${isActive 
                ? 'bg-brand-accent text-brand-bg-secondary shadow-md xl:max-w-[120px] xl:opacity-100' 
                : 'text-white/60 hover:text-white hover:bg-white/10 xl:max-w-0 xl:opacity-0 xl:overflow-hidden xl:px-0 xl:py-0 group-hover:xl:max-w-[120px] group-hover:xl:opacity-100 group-hover:xl:px-5 group-hover:xl:py-2'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

