import type { OfficeEventDto } from '@types';
import { formatDateTime } from '../../../utils/dateTime';
import { getEventBadgeClass, getEventEmoji } from './calendarPresentation';

interface ScheduleCalendarViewProps {
  events: OfficeEventDto[];
  onEventClick: (event: OfficeEventDto) => void;
}

export function ScheduleCalendarView({ events, onEventClick }: ScheduleCalendarViewProps) {
  return (
    <div className="flex max-h-[500px] flex-1 flex-col overflow-y-auto border-t border-outline-variant bg-surface custom-scrollbar">
      {events.length === 0 ? (
        <div className="py-8 text-center text-base italic text-on-surface-variant">No upcoming events scheduled.</div>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          {events.map(event => (
            <div key={event.id} onClick={() => onEventClick(event)} className={`m3-elevation-1 flex cursor-pointer items-center justify-between gap-8 rounded-xl p-3 text-sm font-bold leading-tight transition-all hover:m3-elevation-2 ${getEventBadgeClass(event.eventType)}`}>
              <div className="flex min-w-0 flex-1 items-center gap-7">
                <span className="shrink-0 text-2xl">{getEventEmoji(event.eventType)}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-bold">{event.title}</span>
                  {event.location && <span className="mt-0.5 max-w-full truncate text-sm font-medium uppercase tracking-wider opacity-70">📍 {event.location}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end pl-4 text-right">
                <span className="text-sm font-bold capitalize">{formatDateTime(event.startTime, { weekday: 'long', month: 'short', day: 'numeric' }, 'en-SE')}</span>
                <span className="mt-0.5 text-sm font-medium opacity-70">{formatDateTime(event.startTime, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
