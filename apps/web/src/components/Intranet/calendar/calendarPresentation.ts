const EVENT_STYLES: Record<string, { badge: string; circle: string }> = {
  Meeting: { badge: 'bg-sky-200 hover:bg-sky-300 text-sky-950 border-0', circle: 'bg-sky-500' },
  Fika: { badge: 'bg-amber-200 hover:bg-amber-300 text-amber-950 border-0', circle: 'bg-amber-500' },
  Social: { badge: 'bg-purple-200 hover:bg-purple-300 text-purple-950 border-0', circle: 'bg-purple-500' },
  Birthday: { badge: 'bg-pink-200 hover:bg-pink-300 text-pink-950 border-0', circle: 'bg-pink-500' },
  GoLive: { badge: 'bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-0', circle: 'bg-emerald-500' },
  ExternalSync: { badge: 'bg-cyan-200 hover:bg-cyan-300 text-cyan-950 border-0', circle: 'bg-cyan-500' },
};

const DEFAULT_STYLE = {
  badge: 'bg-surface-container hover:bg-surface-container-high text-on-surface border-0',
  circle: 'bg-slate-500',
};

export const getEventBadgeClass = (eventType?: string) =>
  eventType ? EVENT_STYLES[eventType]?.badge ?? DEFAULT_STYLE.badge : DEFAULT_STYLE.badge;

export const getEventCircleColor = (eventType?: string) =>
  eventType ? EVENT_STYLES[eventType]?.circle ?? DEFAULT_STYLE.circle : DEFAULT_STYLE.circle;

export const getEventEmoji = (type?: string) => {
  switch (type) {
    case 'Meeting': return '🤝';
    case 'Fika': return '☕';
    case 'Social': return '🎉';
    case 'Birthday': return '🎂';
    case 'GoLive': return '🚀';
    case 'ExternalSync': return '🔄';
    default: return '📅';
  }
};
