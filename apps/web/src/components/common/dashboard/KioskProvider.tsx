import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { getSavedTimeframe } from '../../../utils/timeframeStorage';
import { KioskContext, type KioskMode } from './KioskContext';

const KIOSK_ROTATION_SECONDS = 15;
const IDLE_TIMEOUT_SECONDS = 10;

export function KioskProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const matches = useRouterState({ select: (s) => s.matches });
  
  const [mode, setMode] = useState<KioskMode>('kiosk');
  const [kioskTimer, setKioskTimer] = useState(KIOSK_ROTATION_SECONDS);
  const [idleTimer, setIdleTimer] = useState(0);
  
  const currentRoute = matches[matches.length - 1]?.routeId;

  useEffect(() => {
    const ticker = setInterval(() => {
      if (currentRoute?.startsWith('/settings')) {
        if (mode !== 'paused') {
           setMode('paused');
        }
        return;
      }
      
      if (mode === 'kiosk') {
        setKioskTimer((prev) => {
          if (prev <= 1) {
            const routes = ['/financial', '/fleet-status', '/intranet'] as const;
            const currentIndex = routes.indexOf(currentRoute as '/financial' | '/fleet-status' | '/intranet');
            const nextIndex = (currentIndex + 1) % routes.length;
            const nextRoute = routes[nextIndex];
            
            if (nextRoute === '/financial') {
              void navigate({ to: '/financial', search: { timeframe: getSavedTimeframe('/financial') } });
            } else if (nextRoute === '/fleet-status') {
              void navigate({ to: '/fleet-status', search: { timeframe: getSavedTimeframe('/fleet-status') } });
            } else if (nextRoute === '/intranet') {
              void navigate({ to: '/intranet' });
            }
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
  }, [mode, currentRoute, navigate]);

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
    <KioskContext.Provider value={{ mode, setMode, kioskTimer, idleTimer, progress, togglePaused }}>
      {children}
    </KioskContext.Provider>
  );
}
