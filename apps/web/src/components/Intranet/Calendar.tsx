import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings,
  CalendarDays,
  CalendarRange,
  ListTodo
} from 'lucide-react';
import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { useGetApiUsersMe } from '../../api/generated/endpoints';
import { getKioskToken } from '../../utils/auth';
import { 
  useCalendarEventsQuery, 
  useCreateCalendarEventMutation, 
  useUpdateCalendarEventMutation, 
  useDeleteCalendarEventMutation,
  useCalendarTokenQuery,
  useRegenerateCalendarTokenMutation
} from '../../hooks/useCalendarQueries';
import { toast } from 'sonner';
import { EventType, RecurrenceType } from '@types';
import type { OfficeEventDto } from '@types';

// Sub-components
import { EventDetailModal } from './EventDetailModal';
import { EventCreateModal } from './EventCreateModal';
import { EventEditModal } from './EventEditModal';
import { CalendarSettingsModal } from './CalendarSettingsModal';

type ViewMode = 'month' | 'week' | 'schedule';

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

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const todayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (viewMode === 'week' && todayRef.current) {
      const timer = setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentDate]);
  
  // Modals/panels visibility
  const [selectedEvent, setSelectedEvent] = useState<OfficeEventDto | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTokenRequested, setIsTokenRequested] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState<{
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    eventType: EventType;
    isImportant: boolean;
    isRecurring: boolean;
    isSpecial: boolean;
    recurrence: RecurrenceType;
  }>({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    eventType: 'General',
    isImportant: false,
    isRecurring: false,
    isSpecial: false,
    recurrence: 'None'
  });

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      eventType: 'General' as EventType,
      isImportant: false,
      isRecurring: false,
      isSpecial: false,
      recurrence: 'None' as RecurrenceType
    });
  };

  // Queries
  const { data: meData } = useGetApiUsersMe();
  const userRole = meData?.data?.role;
  const isKioskDevice = !!getKioskToken() && userRole !== 'Admin' && userRole !== 'Employee';
  const isWriter = !isKioskDevice && (userRole === 'Admin' || userRole === 'Employee');
  const isAdmin = !isKioskDevice && userRole === 'Admin';

  // Fetch a larger window to support month/week view offsets cleanly
  const rangeBoundaries = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }, [currentDate]);

  // Generate mock events for design verification
  const mockEvents = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = (today.getDay() + 6) % 7; // Mon=0
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);

    const types: (keyof typeof EventType)[] = ['Meeting', 'Fika', 'Social', 'Birthday', 'GoLive', 'ExternalSync', 'General'];
    return types.map((type, idx) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + (idx % 7)); // Distribute Mon-Sun
      date.setHours(10 + (idx % 3) * 2, 0, 0, 0); // e.g. 10:00, 12:00, 14:00
      const end = new Date(date);
      end.setHours(date.getHours() + 1);

      return {
        id: `mock-${type.toLowerCase()}`,
        title: `${type} Verification`,
        description: `This is a mock event of type ${type} for verifying calendar styles.`,
        location: `Meeting Room ${idx + 1}`,
        startTime: date.toISOString(),
        endTime: end.toISOString(),
        eventType: type,
        isImportant: type === 'GoLive',
        isRecurring: false,
        isSpecial: false,
        recurrence: 'None'
      } as OfficeEventDto;
    });
  }, []);

  // Load events
  const { data: rawEvents = [], isLoading } = useCalendarEventsQuery(rangeBoundaries.start, rangeBoundaries.end);
  const events = useMemo(() => [...rawEvents, ...mockEvents], [rawEvents, mockEvents]);
  const { data: tokenData } = useCalendarTokenQuery(isWriter && isTokenRequested);

  // Mutations
  const createEventMutation = useCreateCalendarEventMutation(() => {
    setIsCreateModalOpen(false);
    resetEventForm();
  });
  const updateEventMutation = useUpdateCalendarEventMutation(() => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
    resetEventForm();
  });
  const deleteEventMutation = useDeleteCalendarEventMutation(() => {
    setSelectedEvent(null);
  });
  const regenerateTokenMutation = useRegenerateCalendarTokenMutation();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells = [];
    
    // Prev Month Padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    
    // Current Month Days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next Month Padding
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [year, month, daysInMonth, firstDayIndex, prevMonthDays]);

  // Week View Calculations
  const weekDays = useMemo(() => {
    const days = [];
    const currentDayOfWeek = (currentDate.getDay() + 6) % 7; // Mon=0
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 14);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 14);
      setCurrentDate(d);
    }
  };

  const handleCellClick = (date: Date) => {
    if (!isWriter) {
      toast.error('You do not have permission to add calendar events.');
      return;
    }
    const localDateTimeStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEventForm({
      title: '',
      description: '',
      location: '',
      startTime: localDateTimeStr,
      endTime: new Date(date.getTime() + 60 * 60 * 1000 - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      eventType: 'General' as EventType,
      isImportant: false,
      isRecurring: false,
      isSpecial: false,
      recurrence: 'None' as RecurrenceType
    });
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: OfficeEventDto) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate({
      title: eventForm.title,
      description: eventForm.description || null,
      location: eventForm.location || null,
      startTime: new Date(eventForm.startTime).toISOString(),
      endTime: new Date(eventForm.endTime).toISOString(),
      eventType: eventForm.eventType,
      isImportant: eventForm.isImportant,
      isRecurring: eventForm.isRecurring,
      isSpecial: eventForm.isSpecial,
      recurrence: eventForm.recurrence
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent?.id) return;
    if (selectedEvent.id.toString().startsWith('mock-')) {
      toast.success('Mock event updated successfully.');
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      resetEventForm();
      return;
    }
    updateEventMutation.mutate({
      id: selectedEvent.id,
      dto: {
        title: eventForm.title,
        description: eventForm.description || null,
        location: eventForm.location || null,
        startTime: new Date(eventForm.startTime).toISOString(),
        endTime: new Date(eventForm.endTime).toISOString(),
        eventType: eventForm.eventType,
        isImportant: eventForm.isImportant,
        isRecurring: eventForm.isRecurring,
        isSpecial: eventForm.isSpecial,
        recurrence: eventForm.recurrence
      }
    });
  };

  const openEditModal = (event: OfficeEventDto) => {
    setSelectedEvent(null);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      startTime: event.startTime ? new Date(new Date(event.startTime).getTime() - new Date(event.startTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      endTime: event.endTime ? new Date(new Date(event.endTime).getTime() - new Date(event.endTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      eventType: (event.eventType || 'General') as EventType,
      isImportant: event.isImportant || false,
      isRecurring: event.isRecurring || false,
      isSpecial: event.isSpecial || false,
      recurrence: (event.recurrence || 'None') as RecurrenceType
    });
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const copyFeedLink = () => {
    if (!tokenData?.token) return;
    const feedUrl = `${window.location.origin}/api/intranet/calendar/feed.ics?token=${tokenData.token}`;
    navigator.clipboard.writeText(feedUrl);
    toast.success('Subscription link copied to clipboard.');
  };

  const getEventsForDay = (dayDate: Date) => {
    return events.filter(event => {
      if (!event.startTime || !event.endTime) return false;
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      const d = new Date(dayDate);
      d.setHours(0,0,0,0);
      
      const s = new Date(start);
      s.setHours(0,0,0,0);
      
      const e = new Date(end);
      e.setHours(0,0,0,0);
      
      return d >= s && d <= e;
    });
  };

  // Styles Configuration Map
  const EVENT_STYLES: Record<string, { badge: string; circle: string }> = {
    Meeting: {
      badge: 'bg-sky-100/70 hover:bg-sky-200/70 text-sky-950 border-0',
      circle: 'bg-blue-500',
    },
    Fika: {
      badge: 'bg-amber-100/70 hover:bg-amber-200/70 text-amber-950 border-0',
      circle: 'bg-orange-500',
    },
    Social: {
      badge: 'bg-purple-100/70 hover:bg-purple-200/70 text-purple-950 border-0',
      circle: 'bg-purple-500',
    },
    Birthday: {
      badge: 'bg-pink-100/70 hover:bg-pink-200/70 text-pink-950 border-0',
      circle: 'bg-pink-500',
    },
    GoLive: {
      badge: 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-950 border-0',
      circle: 'bg-emerald-500',
    },
    ExternalSync: {
      badge: 'bg-cyan-100/70 hover:bg-cyan-200/70 text-cyan-950 border-0',
      circle: 'bg-cyan-500',
    },
  };

  const DEFAULT_STYLE = {
    badge: 'bg-surface-container/70 hover:bg-surface-container-high/70 text-on-surface border-0',
    circle: 'bg-slate-500',
  };

  // Badge mapping helper
  const getEventBadgeClass = (eventType?: string): string => {
    if (!eventType) return DEFAULT_STYLE.badge;
    return EVENT_STYLES[eventType]?.badge ?? DEFAULT_STYLE.badge;
  };

  // Color circle mapping helper for responsive month view
  const getEventCircleColor = (eventType?: string): string => {
    if (!eventType) return DEFAULT_STYLE.circle;
    return EVENT_STYLES[eventType]?.circle ?? DEFAULT_STYLE.circle;
  };

  const navLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-SE', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString('en-SE', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-SE', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return `Upcoming Events`;
  }, [currentDate, viewMode, weekDays]);

  const scheduleEvents = useMemo(() => {
    const now = new Date(currentDate);
    now.setHours(0,0,0,0);
    return events
      .filter(e => e.startTime && new Date(e.startTime) >= now)
      .slice(0, 20);
  }, [events, currentDate]);

  return (
    <CollectionPanel 
      title="Company Calendar" 
      isLoading={isLoading}
      className="h-full relative select-none"
      actions={
        <div className="flex items-center gap-1">
          {/* View Mode Selector */}
          <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/50 shadow-inner h-10">
            <button
              onClick={() => setViewMode('month')}
              className={`h-full w-10 flex items-center justify-center rounded-full transition-all cursor-pointer ${viewMode === 'month' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'}`}
              title="Month View"
            >
              <CalendarDays size={18} />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`h-full w-10 flex items-center justify-center rounded-full transition-all cursor-pointer ${viewMode === 'week' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'}`}
              title="Week View"
            >
              <CalendarRange size={18} />
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`h-full w-10 flex items-center justify-center rounded-full transition-all cursor-pointer ${viewMode === 'schedule' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'}`}
              title="Schedule list"
            >
              <ListTodo size={18} />
            </button>
          </div>

          {isWriter ? (
            <button 
              onClick={() => handleCellClick(new Date())}
              className="bg-brand-btn-primary text-white text-sm px-5 h-10 rounded-full font-bold hover:bg-brand-btn-quaternary transition m3-elevation-1 hover:m3-elevation-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Add Event
            </button>
          ) : (
            <button 
              onClick={() => toast.error('You do not have permission to add calendar events.')}
              className="bg-surface-container border border-outline-variant text-on-surface-variant text-sm px-5 h-10 rounded-full font-bold transition flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
              title="Add Event (requires Employee/Admin permissions)"
            >
              <Plus size={16} /> Add Event
            </button>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface-variant rounded-full border border-outline-variant hover:bg-surface-container transition cursor-pointer shrink-0"
            title="Calendar Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      }
    >
      <div className="mt-1 flex flex-col h-full min-h-[450px] bg-surface-container">
        
        {/* Month/Week Navigation */}
        {viewMode !== 'schedule' && (
          <div className="flex items-center justify-between bg-surface pb-2 px-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-on-surface">{navLabel}</h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container transition cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-1 text-sm text-slate-650 hover:text-slate-850 hover:bg-surface-container rounded font-black uppercase tracking-wider cursor-pointer"
              >
                Today
              </button>
              <button 
                onClick={handleNext}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container transition cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {viewMode === 'month' && (
          <div className="flex flex-col bg-surface-container flex-1 px-4 py-2 min-h-0">
            {/* Days grid headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-black text-sm uppercase tracking-widest text-on-surface-variant mb-1">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-px bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex-1 min-h-[350px] shadow-sm">
              {calendarCells.map((cell, idx) => {
                const dayEvents = getEventsForDay(cell.date);
                const isToday = cell.date.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={idx}
                    onClick={() => handleCellClick(cell.date)}
                    className={`min-h-[50px] md:min-h-[65px] bg-surface p-1.5 flex flex-col transition duration-150 relative group ${
                      cell.isCurrentMonth ? '' : 'bg-surface-container-low opacity-40'
                    } ${isToday ? 'bg-calendar-today-bg' : 'hover:bg-brand-hover'} ${
                      isWriter ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-black ${
                        isToday ? 'bg-brand-bg-secondary text-white px-1.5 py-0.5 rounded-full font-bold' : 'text-slate-650'
                      }`}>
                        {cell.date.getDate()}
                      </span>
                      {isWriter && cell.isCurrentMonth && (
                        <Plus size={10} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </div>

                    {/* Centered event dot indicators */}
                    <div className="flex-1 flex flex-wrap gap-1 items-center justify-center py-1">
                      {dayEvents.map(event => (
                        <span
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm transition-all hover:scale-125 cursor-pointer ${getEventCircleColor(event.eventType)}`}
                          title={`${event.title || 'Event'} (${event.startTime ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {viewMode === 'week' && (
          <div className="flex divide-x divide-slate-100 overflow-x-auto bg-surface border-t border-outline-variant custom-scrollbar flex-1 w-full min-w-0">
            {weekDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={idx}
                  ref={isToday ? todayRef : undefined}
                  onClick={() => handleCellClick(day)}
                  className={`bg-surface p-4 flex flex-col h-full w-[200px] shrink-0 transition-colors ${
                    isToday ? 'bg-calendar-today-bg' : 'hover:bg-brand-hover'
                  } cursor-pointer`}
                >
                  <div className="flex items-start justify-between pb-2 border-b border-outline-variant mb-2 gap-1.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-on-surface-variant uppercase tracking-widest truncate leading-tight">
                        {day.toLocaleDateString('en-SE', { weekday: 'short' })}
                      </span>
                      <span className={`text-base font-black mt-0.5 leading-none ${isToday ? 'text-on-surface underline-offset-2 underline decoration-brand-accent decoration-2' : 'text-on-surface'}`}>
                        {day.getDate()}
                      </span>
                    </div>
                    <span className="text-sm text-on-surface-variant font-bold whitespace-nowrap shrink-0 mt-0.5">
                      {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    {dayEvents.map(event => {
                      const timeStr = event.startTime 
                        ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : '';
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(e, event)}
                          className={`text-sm p-2 rounded-xl leading-tight font-bold flex flex-col gap-0.5 transition-all cursor-pointer ${getEventBadgeClass(event.eventType)}`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{getEventEmoji(event.eventType)}</span>
                            {timeStr && <span className="opacity-70">{timeStr}</span>}
                          </div>
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SCHEDULE / LIST VIEW ── */}
        {viewMode === 'schedule' && (
          <div className="flex-1 flex flex-col overflow-y-auto bg-surface border-t border-outline-variant custom-scrollbar max-h-[500px]">
            {scheduleEvents.length === 0 ? (
              <div className="text-sm text-on-surface-variant italic text-center py-8">
                No upcoming events scheduled.
              </div>
            ) : (
              <div className="flex flex-col p-0">
                {scheduleEvents.map(event => {
                  const dateStr = event.startTime 
                    ? new Date(event.startTime).toLocaleDateString('en-SE', { weekday: 'long', month: 'short', day: 'numeric' })
                    : '';
                  const timeStr = event.startTime 
                    ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '';
                  
                  return (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className="flex items-center justify-between p-4 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors cursor-pointer bg-surface"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="text-2xl shrink-0">
                          {getEventEmoji(event.eventType)}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-black text-on-surface truncate">{event.title}</span>
                          <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                              {event.eventType}
                            </span>
                            {event.location && (
                              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-l border-outline-variant pl-2 truncate max-w-full">
                                📍 {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end text-right shrink-0 pl-4">
                        <span className="text-xs font-black text-on-surface-variant capitalize">{dateStr}</span>
                        <span className="text-xs font-bold text-on-surface-variant mt-0.5">{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Detail / View Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isWriter={isWriter}
          onDelete={(id) => {
            if (id.toString().startsWith('mock-')) {
              toast.success('Mock event deleted successfully.');
              setSelectedEvent(null);
            } else {
              deleteEventMutation.mutate(id);
            }
          }}
          onEdit={openEditModal}
        />
      )}

      {/* Create Modal */}
      <EventCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        form={eventForm}
        onChange={setEventForm}
      />

      {/* Edit Modal */}
      <EventEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        form={eventForm}
        onChange={setEventForm}
      />

      {/* Calendar Settings Modal */}
      <CalendarSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setIsTokenRequested(false);
        }}
        isAdmin={isAdmin}
        isWriter={isWriter}
        token={tokenData?.token ?? undefined}
        isTokenRequested={isTokenRequested}
        onGenerateToken={() => setIsTokenRequested(true)}
        onCopyFeedLink={copyFeedLink}
        onRegenerateToken={() => regenerateTokenMutation.mutate(undefined)}
      />
    </CollectionPanel>
  );
}
