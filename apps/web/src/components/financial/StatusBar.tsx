import { useEffect, useState } from 'react';
import './StatusBar.css';

interface Props {
  lastUpdated: Date | null;
  loading: boolean;
  refreshIntervalMs: number;
  onRefresh: () => void;
}

export function StatusBar({ lastUpdated, loading, refreshIntervalMs, onRefresh }: Props) {
  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState(refreshIntervalMs / 1000);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Countdown to next refresh
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - lastUpdated.getTime()) / 1000;
      const remaining = Math.max(0, refreshIntervalMs / 1000 - elapsed);
      setCountdown(Math.round(remaining));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated, refreshIntervalMs]);

  const timeStr = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  const nextMins = Math.floor(countdown / 60);
  const nextSecs = countdown % 60;
  const nextStr = nextMins > 0
    ? `${nextMins}m ${nextSecs}s`
    : `${nextSecs}s`;

  return (
    <footer className="status-bar">
      <div className="status-bar__left">
        <span className={`status-dot ${loading ? 'status-dot--fetching' : 'status-dot--live'}`} />
        <span className="text-muted" style={{ fontSize: 11 }}>
          {loading ? 'Fetching…' : `Last updated ${updatedStr}`}
        </span>
        <span className="status-sep">·</span>
        <span className="text-muted" style={{ fontSize: 11 }}>
          Next refresh in {nextStr}
        </span>
        <button className="status-refresh-btn" onClick={onRefresh} title="Refresh now">
          ↺
        </button>
      </div>

      <div className="status-bar__right">
        <span className="status-bar__date text-muted">{dateStr}</span>
        <span className="status-bar__clock">{timeStr}</span>
      </div>
    </footer>
  );
}
