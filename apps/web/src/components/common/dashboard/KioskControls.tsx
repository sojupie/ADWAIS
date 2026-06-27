import { Play, Pause } from 'lucide-react';
import { useKiosk } from './KioskContext';

export function KioskControls() {
  const { mode, progress, togglePaused } = useKiosk();

  return (
    <div className="flex items-center gap-1">
      <div className={`flex items-center justify-between w-[200px] px-3 py-1.5 border rounded-sm shadow-sm transition-colors duration-500 whitespace-nowrap shrink-0
        ${mode === 'kiosk' ? 'bg-emerald-50 border-emerald-200' :
          mode === 'interactive' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full 
              ${mode === 'kiosk' ? 'bg-emerald-500 kiosk-pulse' :
              mode === 'interactive' ? 'bg-amber-500' : 'bg-slate-400'}`}
          />
          <span className={`text-sm font-black tracking-widest
              ${mode === 'kiosk' ? 'text-emerald-700' :
              mode === 'interactive' ? 'text-amber-700' : 'text-slate-600'}`}>
            {mode.toUpperCase()}
          </span>
        </div>

        <div className="relative w-5 h-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="16"
              fill="none" stroke="currentColor" strokeWidth="4"
              className="text-black/5"
            />
            <circle
              cx="18" cy="18" r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="100, 100"
              strokeDashoffset={100 - progress}
              strokeLinecap="round"
              className={`transition-all duration-300 
                  ${mode === 'kiosk' ? 'text-emerald-500' :
                  mode === 'interactive' ? 'text-amber-500' : 'text-transparent'}`}
            />
          </svg>
        </div>
      </div>

      <button
        onClick={togglePaused}
        className="flex items-center justify-center w-9 h-9 bg-white/10 border border-white/20 rounded-sm text-white hover:bg-white/20 transition-all shadow-sm active:scale-95"
        title={mode === 'paused' ? 'Resume Kiosk' : 'Pause Kiosk'}
      >
        {mode === 'paused' ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
      </button>
    </div>
  );
}
