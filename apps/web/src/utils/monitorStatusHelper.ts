export function normalizeStatus(status?: string | number | null): string {
    if (status === undefined || status === null) return 'UNKNOWN';
    const s = status.toString().toUpperCase().trim();
    if (s === '1' || s === 'STARTING' || s === 'NOT CHECKED YET' || s === 'NOT CHECKED') return 'STARTING';
    if (s === '2' || s === 'UP') return 'UP';
    if (s === '8' || s === '9' || s === 'DOWN' || s === 'SEEMS DOWN' || s === 'CRITICAL') return 'DOWN';
    if (s === '0' || s === 'PAUSED') return 'PAUSED';
    return 'UNKNOWN';
}

export type MonitorStatus = 'operational' | 'degraded' | 'down' | 'unknown' | 'paused' | 'starting';

export const STATUS_THEMES = {
  down: {
    bg: 'bg-status-down-container/70 hover:bg-status-down-container/90',
    border: 'border-0',
    text: 'text-status-down-on-container font-bold',
    valueText: 'text-status-down-on-container font-black',
    mutedText: 'text-status-down-muted font-semibold',
    dot: 'bg-status-down shadow-[0_0_8px] shadow-status-down/50 animate-pulse'
  },
  degraded: {
    bg: 'bg-status-degraded-container/70 hover:bg-status-degraded-container/90',
    border: 'border-0',
    text: 'text-status-degraded-on-container font-bold',
    valueText: 'text-status-degraded-on-container font-black',
    mutedText: 'text-status-degraded-muted font-semibold',
    dot: 'bg-status-degraded shadow-[0_0_8px] shadow-status-degraded/50'
  },
  operational: {
    bg: 'bg-status-up-container/70 hover:bg-status-up-container/90',
    border: 'border-0',
    text: 'text-status-up-on-container',
    valueText: 'text-status-up-on-container font-bold',
    mutedText: 'text-status-up-muted',
    dot: 'bg-status-up shadow-[0_0_8px] shadow-status-up/30'
  },
  unknown: {
    bg: 'bg-status-unknown-container/70 hover:bg-status-unknown-container/90',
    border: 'border-0',
    text: 'text-status-unknown-on-container font-bold',
    valueText: 'text-status-unknown-on-container font-black',
    mutedText: 'text-status-unknown-muted font-semibold',
    dot: 'bg-status-unknown shadow-[0_0_8px] shadow-status-unknown/40'
  },
  paused: {
    bg: 'bg-status-paused-container/70 hover:bg-status-paused-container/90',
    border: 'border-0',
    text: 'text-status-paused-on-container font-bold',
    valueText: 'text-status-paused-on-container font-black',
    mutedText: 'text-status-paused-muted font-semibold',
    dot: 'bg-status-paused shadow-[0_0_6px] shadow-status-paused/40'
  },
  starting: {
    bg: 'bg-status-starting-container/70 hover:bg-status-starting-container/90',
    border: 'border-0',
    text: 'text-status-starting-on-container font-bold',
    valueText: 'text-status-starting-on-container font-black',
    mutedText: 'text-status-starting-muted font-semibold',
    dot: 'bg-status-starting shadow-[0_0_6px] shadow-status-starting/40'
  }
} as const;

export function getMonitorStatus(
  currentStatus: string | number | null | undefined,
  currentLatency: number | null | undefined,
  latencyDegradedFloor: number | null | undefined
): MonitorStatus {
  const status = normalizeStatus(currentStatus);
  if (status === 'STARTING') return 'starting';
  if (status === 'DOWN') return 'down';
  if (status === 'PAUSED') return 'paused';
  if (status === 'UNKNOWN') return 'unknown';

  if (currentLatency !== null && currentLatency !== undefined && latencyDegradedFloor !== null && latencyDegradedFloor !== undefined && currentLatency > latencyDegradedFloor) {
    return 'degraded';
  }

  return 'operational';
}