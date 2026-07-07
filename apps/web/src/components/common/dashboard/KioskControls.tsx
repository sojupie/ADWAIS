import { Play, Pause } from 'lucide-react';
import { useKiosk } from './KioskContext';

export function KioskControls() {
  const { mode, progress, togglePaused } = useKiosk();

  return (
    <button
      type="button"
      onClick={togglePaused}
      className={`relative overflow-hidden flex items-center justify-between w-[200px] px-3.5 py-1.5 border rounded-lg shadow-sm transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]
        ${mode === 'kiosk' ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' :
          mode === 'interactive' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 
          'bg-slate-200 border-slate-200 hover:bg-slate-50'}`}
      title={mode === 'paused' ? 'Resume Kiosk' : 'Pause Kiosk'}
    >
      {/* Left side: Status dot and label matching UserAccountLink text-sm font-bold */}
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full transition-colors duration-500
            ${mode === 'kiosk' ? 'bg-emerald-500 kiosk-pulse' :
            mode === 'interactive' ? 'bg-amber-500' : 'bg-slate-400'}`}
        />
        <span className={`text-sm font-bold tracking-wider transition-colors duration-500
            ${mode === 'kiosk' ? 'text-emerald-700' :
            mode === 'interactive' ? 'text-amber-700' : 'text-slate-650'}`}>
          {mode.toUpperCase()}
        </span>
      </div>

      {/* Right side: Clear, sharp indicator icon matching font height */}
      <div className={`flex items-center justify-center w-5 h-5 transition-colors duration-500 z-10
        ${mode === 'kiosk' ? 'text-emerald-700' :
          mode === 'interactive' ? 'text-amber-700' : 'text-slate-650'}`}
      >
        {mode === 'paused' ? (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        ) : (
          <Pause size={14} fill="currentColor" />
        )}
      </div>

      {/* Bottom Linear Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5 z-0">
        <div 
          className={`h-full transition-all duration-1000 ease-linear
            ${mode === 'kiosk' ? 'bg-emerald-500' :
              mode === 'interactive' ? 'bg-amber-500' : 'bg-transparent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}
