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
    <div className="group grid grid-cols-3 gap-1.5 md:flex md:gap-1 bg-brand-bg-secondary p-1.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-brand-bg-secondary/10 pointer-events-auto w-full md:w-auto max-w-[400px] md:max-w-none items-center min-h-14">
      {options.map((opt) => {
        const isActive = timeframe === opt.value;
        const buttonCls = isActive
          ? 'bg-brand-accent text-brand-bg-secondary shadow-md'
          : 'text-white/60 hover:text-white hover:bg-white/10';

        return (
          <button
            key={opt.value}
            id={`period-${opt.value}`}
            onClick={() => handleSelect(opt.value)}
            className={`px-3 py-2 md:px-5 md:py-2 text-xs md:text-sm font-black rounded-lg transition-all duration-300 tracking-widest uppercase cursor-pointer text-center ${buttonCls}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

