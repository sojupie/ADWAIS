import { useState, useEffect } from 'react';

const INITIAL_EVENTS = [
  { id: 1, time: '14:00', title: 'Tech Sync', location: 'Conf Room A' },
  { id: 2, time: '15:00', title: 'Fika', location: 'Kitchen' },
  { id: 3, time: '16:30', title: 'Client Demo', location: 'Zoom' }
];

export function OfficeContext() {
  const [time, setTime] = useState(new Date());
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [isAdding, setIsAdding] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventTime.trim()) return;
    setEvents([...events, {
      id: Date.now(),
      time: eventTime.trim(),
      title: eventTitle.trim(),
      location: eventLocation.trim() || 'TBD'
    }].sort((a, b) => a.time.localeCompare(b.time)));
    setEventTitle('');
    setEventTime('');
    setEventLocation('');
    setIsAdding(false);
  };
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const secondsString = time.getSeconds().toString().padStart(2, '0');

  return (
    <section className="rounded-xl shadow-sm flex flex-col overflow-hidden bg-brand-bg-secondary text-white h-full relative">
      {isAdding && (
        <div className="absolute inset-0 z-20 bg-brand-bg-secondary/95 backdrop-blur-md p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest mb-4">Add New Event</h3>
          <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-1/3 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent" required />
              <input type="text" placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent placeholder:text-white/40" required autoFocus />
            </div>
            <input type="text" placeholder="Location (optional)" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent placeholder:text-white/40" />
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="text-white/60 hover:text-white px-4 py-2 font-black uppercase tracking-widest text-sm transition-colors">Cancel</button>
              <button type="submit" className="bg-brand-accent text-brand-bg-secondary px-4 py-2 rounded font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all">Add Event</button>
            </div>
          </form>
        </div>
      )}

      <div className="absolute top-0 right-0 p-4 opacity-10">
         <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 2L2 22H22L12 2Z" />
         </svg>
      </div>
      
      <div className="p-6 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-sm font-black text-brand-accent uppercase tracking-widest mb-1">{dateString}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl lg:text-6xl font-black tracking-tighter">{timeString}</span>
              <span className="text-xl font-bold text-white/50">:{secondsString}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl lg:text-4xl">🌤️</span>
            <span className="text-lg font-bold mt-1">18°C</span>
            <span className="text-sm font-bold uppercase tracking-widest text-white/60">Karlstad</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest">Today's Schedule</h3>
            <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-white/40">{events.length} Events</span>
               <button 
                 onClick={() => {
                   if (!isAdding) setEventTime(new Date().toTimeString().slice(0, 5));
                   setIsAdding(!isAdding);
                 }}
                 className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-2 py-0.5 rounded-[4px] text-sm font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer"
               >
                 {isAdding ? 'Cancel' : '+ Add Event'}
               </button>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                <span className="text-sm font-black text-brand-accent w-12 shrink-0 text-right">{e.time}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-tight">{e.title}</span>
                  <span className="text-sm font-bold text-white/50 uppercase tracking-widest mt-0.5">{e.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
