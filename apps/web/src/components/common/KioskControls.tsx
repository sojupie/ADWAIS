import { useEffect, useState } from 'react';
import { useNavigate, useRouterState, useSearch } from '@tanstack/react-router';
import { Play, Pause } from 'lucide-react';
import type { Timeframe } from '../../schemas';

type KioskMode = 'kiosk' | 'interactive' | 'paused';

const KIOSK_ROTATION_SECONDS = 15;
const IDLE_TIMEOUT_SECONDS = 10;

export function KioskControls() {
  const navigate = useNavigate();
  const matches = useRouterState({ select: (s) => s.matches });
  const search = useSearch({ 
    strict: false,
    select: (s: Record<string, unknown>) => s
  });
  
  const [mode, setMode] = useState<KioskMode>('kiosk');
  const [kioskTimer, setKioskTimer] = useState(KIOSK_ROTATION_SECONDS);
  const [idleTimer, setIdleTimer] = useState(0);
  
  const lastTimeframe: Timeframe = (search?.timeframe as Timeframe) ?? 'T30';
  const currentRoute = matches[matches.length - 1]?.routeId;

  useEffect(() => {
    const ticker = setInterval(() => {
      if (mode === 'kiosk') {
        setKioskTimer((prev) => {
          if (prev <= 1) {
            const routes = ['/financial', '/fleet-status', '/intranet'];
            const currentIndex = routes.indexOf(currentRoute as string);
            const nextIndex = (currentIndex + 1) % routes.length;
            const nextRoute = routes[nextIndex];
            
            navigate({ 
              to: nextRoute as any, 
              search: (nextRoute === '/intranet' ? undefined : { timeframe: lastTimeframe }) as any
            });
            return KIOSK_ROTATION_SECONDS;
          }
          return prev - 1;
        });
      } else if (mode === 'interactive') {
        setIdleTimer((prev) => {
          if (prev >= IDLE_TIMEOUT_SECONDS) {
            setMode('kiosk');
            setKioskTimer(KIOSK_ROTATION_SECONDS);
            return 0;
          }
          return prev + 1;
        });
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [mode, currentRoute, lastTimeframe, navigate]);

  useEffect(() => {
    const handleInteraction = () => {
      if (mode === 'kiosk') {
        setMode('interactive');
        setKioskTimer(KIOSK_ROTATION_SECONDS);
      }
      if (mode === 'interactive') {
        setIdleTimer(0);
      }
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [mode]);

  const togglePaused = () => {
    if (mode === 'paused') {
      setMode('kiosk');
      setKioskTimer(KIOSK_ROTATION_SECONDS);
    } else {
      setMode('paused');
      setKioskTimer(KIOSK_ROTATION_SECONDS);
      setIdleTimer(0);
    }
  };

  const progress = mode === 'kiosk' 
    ? ((KIOSK_ROTATION_SECONDS - kioskTimer) / KIOSK_ROTATION_SECONDS) * 100 
    : mode === 'interactive' 
      ? (idleTimer / IDLE_TIMEOUT_SECONDS) * 100 
      : 0;

  return (
    <div className="flex items-center gap-4">
      <div className={`flex items-center gap-4 px-3 py-1.5 border rounded-[4px] shadow-sm transition-colors duration-500
        ${mode === 'kiosk' ? 'bg-emerald-50 border-emerald-200' : 
          mode === 'interactive' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full 
              ${mode === 'kiosk' ? 'bg-emerald-500 kiosk-pulse' : 
                mode === 'interactive' ? 'bg-amber-500' : 'bg-slate-400'}`} 
            />
            <span className={`text-xs font-black tracking-widest
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
        className="flex items-center justify-center w-9 h-9 bg-white/10 border border-white/20 rounded-[4px] text-white hover:bg-white/20 transition-all shadow-sm active:scale-95"
        title={mode === 'paused' ? 'Resume Kiosk' : 'Pause Kiosk'}
      >
        {mode === 'paused' ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
      </button>
    </div>
  );
}
