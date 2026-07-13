import { useMemo } from 'react';
import { useGetApiWeather } from '../../api/generated/endpoints';
import { useCalendarEventsQuery } from '../../hooks/useCalendarQueries';
import type { OfficeEventDto } from '@types';
import { useClock } from '../../hooks/useClock';

const getWeatherEmoji = (code?: number | null) => {
  if (code === undefined || code === null) return '🌤️';
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 95) return '⛈️';
  return '🌤️';
};

const getEventEmoji = (type?: string) => {
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

export function OfficeContext() {
  const time = useClock();

  // Calculate start/end of today in UTC
  const todayRange = useMemo(() => {
    const start = new Date(time);
    start.setHours(0, 0, 0, 0);
    const end = new Date(time);
    end.setHours(23, 59, 59, 999);
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }, [time]);

  // Generate mock events for design verification
  const mockEvents = useMemo(() => {
    const today = new Date(time);
    
    const event1: OfficeEventDto = {
      id: 'mock-today-meeting',
      title: 'Project Status Sync',
      description: 'Duis sit amet lectus finibus, sollicitudin nunc ac, hendrerit urna. Vivamus gravida nisi a venenatis elementum. Vivamus elementum sapien vitae nunc eleifend imperdiet. Nunc eu turpis lectus.',
      location: 'Meeting Room A',
      startTime: new Date(new Date(today).setHours(10, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date(today).setHours(11, 0, 0, 0)).toISOString(),
      eventType: 'Meeting',
      isImportant: false,
      isRecurring: false,
      isSpecial: false,
      recurrence: 'None'
    };

    const event2: OfficeEventDto = {
      id: 'mock-today-fika',
      title: 'Afternoon Fika',
      description: 'Join the team for afternoon coffee and snacks.',
      location: 'Kitchen',
      startTime: new Date(new Date(today).setHours(14, 30, 0, 0)).toISOString(),
      endTime: new Date(new Date(today).setHours(15, 0, 0, 0)).toISOString(),
      eventType: 'Fika',
      isImportant: false,
      isRecurring: false,
      isSpecial: false,
      recurrence: 'None'
    };

    return [event1, event2];
  }, [time]);

  // Fetch today's events from the backend
  const { data: rawEvents = [], isLoading } = useCalendarEventsQuery(todayRange.start, todayRange.end);
  const events = useMemo(() => [...rawEvents, ...mockEvents], [rawEvents, mockEvents]);

  // Fetch current weather
  const { data: weatherData } = useGetApiWeather();
  const weather = weatherData?.data || {
    weatherCode: 1,
    temperature: 25,
    location: 'Karlstad',
    windSpeed: 5
  };



  const dateString = time.toLocaleDateString('en-SE', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeString = time.toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', hour12: false });

  const formatEventTime = (startTimeStr?: string) => {
    if (!startTimeStr) {
      throw new Error("Cannot format empty event start time string.");
    }
    const date = new Date(startTimeStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid start time string: "${startTimeStr}"`);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <section className="gap-2 rounded-2xl border-0 overflow-hidden bg-brand-bg-secondary text-white h-[400px] max-h-[400px] md:max-h-none md:h-full relative flex flex-col md:grid md:grid-rows-[30%_70%] w-full min-w-0 p-6">
      <div className="relative z-10 flex justify-between items-start gap-4">
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-black text-brand-accent uppercase tracking-widest mb-1">{dateString}</span>
          <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none">{timeString}</span>
        </div>
        {weather && (
          <div className="flex flex-col items-end text-right shrink-0">
            <span className="text-2xl sm:text-3xl lg:text-4xl" title={`Wind: ${weather.windSpeed} km/h`}>
              {getWeatherEmoji(weather.weatherCode)}
            </span>
            <span className="text-base sm:text-lg font-bold mt-1">
              {weather.temperature !== undefined ? `${Math.round(weather.temperature)}°C` : 'N/A'}
            </span>
            <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-white/60">
              {weather.location}
            </span>
          </div>
        )}
      </div>

      {/* Bottom 70% — event list */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full min-w-0">
        <div className="flex items-center justify-between pb-2 mb-1">
          <h3 className="text-sm font-bold text-white/70">Today's Schedule</h3>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white/40">{events.length} Events</span>
          </div>
        </div>

        <div className="flex flex-col overflow-y-auto flex-1 divide-y divide-slate-50/30 custom-scrollbar w-full min-w-0">
          {isLoading ? (
            <div className="text-sm text-white/40 italic text-center py-2">Loading today's schedule...</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-white/40 italic text-center py-2">No events scheduled for today.</div>
          ) : (
            events.map(e => (
              <div 
                key={e.id} 
                className="flex flex-col transition-colors py-4 justify-center w-full min-w-0 shrink-0 gap-1"
              >
                {/* Row 1: icon, time, title */}
                <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                  <span className="text-sm shrink-0 leading-none pr-1">{getEventEmoji(e.eventType)}</span>
                  <span className="text-sm font-black text-brand-accent whitespace-nowrap leading-none shrink-0">
                    {formatEventTime(e.startTime)}
                  </span>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-bold text-white truncate leading-none flex-1 min-w-0">{e.title}</span>
                    {e.location && (
                      <span className="text-sm text-white/60 font-bold uppercase tracking-wider truncate leading-none max-w-[50%] min-w-0">
                        📍 {e.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: content / description */}
                <div className="text-sm text-white/50 truncate min-w-0 leading-normal select-text flex-shrink-0 ml-[22px]">
                  {e.description || 'No description provided.'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
