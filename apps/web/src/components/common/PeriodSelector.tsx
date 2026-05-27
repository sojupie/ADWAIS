import { useNavigate, useSearch } from '@tanstack/react-router';

export function PeriodSelector({ from }: { from: '/financial' | '/fleet-status' }) {
  const { timeframe } = useSearch({ from });
  const navigate = useNavigate({ from });

  const options = [
    { label: '1D', value: 'Today' },
    { label: '7D', value: 'T7' },
    { label: '30D', value: 'T30' },
    { label: '90D', value: 'T90' },
    { label: '365D', value: 'T365' },
    { label: 'YTD', value: 'Ytd' },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 md:flex md:gap-1 bg-brand-bg-tertiary p-1.5 rounded-xl md:rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-brand-bg-secondary/10 pointer-events-auto w-full md:w-auto max-w-[400px] md:max-w-none">
      {options.map((opt) => {
        const isActive = timeframe === opt.value;
        return (
          <button
            key={opt.value}
            id={`period-${opt.value}`}
            onClick={() => navigate({ search: (old: any) => ({ ...old, timeframe: opt.value }) })}
            className={`px-2 py-2 md:px-5 text-[10px] md:text-xs font-black rounded-full transition-all tracking-widest uppercase cursor-pointer text-center
              ${isActive 
                ? 'bg-brand-btn-primary text-white shadow-md' 
                : 'text-slate-500 hover:text-brand-text hover:bg-brand-bg-primary'
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
