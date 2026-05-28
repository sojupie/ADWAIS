import os
import re

base_dir = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\Intranet'

# 1. Update InternalAnnouncements.tsx to use absolute overlay
ann_file = os.path.join(base_dir, 'InternalAnnouncements.tsx')
with open(ann_file, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace the CollectionPanel wrapper to have className="h-full relative"
c = c.replace('className="h-full flex flex-col"', 'className="h-full flex flex-col relative"')

# Replace the form div
old_form = """{isComposing && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3 shrink-0">"""
new_form = """{isComposing && (
        <div className="absolute inset-x-0 top-[49px] bottom-0 z-20 bg-white/95 backdrop-blur-sm p-4 animate-in slide-in-from-top-2 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 shrink-0">"""
c = c.replace(old_form, new_form)

# Add closing div to the form
old_form_close = """          </div>
        </form>
      )}"""
new_form_close = """          </div>
          </form>
        </div>
      )}"""
c = c.replace(old_form_close, new_form_close)
with open(ann_file, 'w', encoding='utf-8') as f: f.write(c)


# 2. Update OfficeContext.tsx
office_file = os.path.join(base_dir, 'OfficeContext.tsx')
with open(office_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('const events = [', 'const INITIAL_EVENTS = [')
c = c.replace('const [time, setTime] = useState(new Date());', """const [time, setTime] = useState(new Date());
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
  };""")

c = c.replace('<button className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer">\n                 + Add Event\n               </button>', """<button 
                 onClick={() => setIsAdding(!isAdding)}
                 className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer"
               >
                 {isAdding ? 'Cancel' : '+ Add Event'}
               </button>""")

add_event_form = """
      {isAdding && (
        <div className="absolute inset-0 z-20 bg-brand-bg-secondary/95 backdrop-blur-md p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest mb-4">Add New Event</h3>
          <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-1/3 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent" required />
              <input type="text" placeholder="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent placeholder:text-white/40" required autoFocus />
            </div>
            <input type="text" placeholder="Location (optional)" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent placeholder:text-white/40" />
            <div className="flex justify-end mt-2">
              <button type="submit" className="bg-brand-accent text-brand-bg-secondary px-4 py-2 rounded font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all">Add Event</button>
            </div>
          </form>
        </div>
      )}
"""
c = c.replace('<section className="rounded-xl shadow-sm flex flex-col overflow-hidden bg-brand-bg-secondary text-white h-full relative">', '<section className="rounded-xl shadow-sm flex flex-col overflow-hidden bg-brand-bg-secondary text-white h-full relative">' + add_event_form)
with open(office_file, 'w', encoding='utf-8') as f: f.write(c)


# 3. Update GoLiveCalendar.tsx
cal_file = os.path.join(base_dir, 'GoLiveCalendar.tsx')
with open(cal_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('import { CollectionPanel } from \'../common/CollectionPanel\';', 'import { useState } from \'react\';\nimport { CollectionPanel } from \'../common/CollectionPanel\';')
c = c.replace('const milestones = [', 'const INITIAL_MILESTONES = [')

new_state = """export function GoLiveCalendar() {
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [isAdding, setIsAdding] = useState(false);
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [days, setDays] = useState('');
  const [date, setDate] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !project.trim() || !days.trim() || !date.trim()) return;
    setMilestones([...milestones, {
      id: Date.now(),
      client: client.trim(),
      project: project.trim(),
      days: parseInt(days, 10),
      date: date.trim()
    }].sort((a, b) => a.days - b.days));
    setClient(''); setProject(''); setDays(''); setDate('');
    setIsAdding(false);
  };
"""
c = c.replace('export function GoLiveCalendar() {', new_state)

c = c.replace('className="h-full"', 'className="h-full relative"')
c = c.replace('<button className="bg-brand-bg-secondary text-white px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text transition-all shadow-sm cursor-pointer">\n          + Milestone\n        </button>', """<button 
          onClick={() => setIsAdding(!isAdding)}
          className={`${isAdding ? 'bg-slate-200 text-slate-700' : 'bg-brand-bg-secondary text-white'} px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text hover:text-white transition-all shadow-sm cursor-pointer`}
        >
          {isAdding ? 'Cancel' : '+ Milestone'}
        </button>""")

add_milestone_form = """
      {isAdding && (
        <div className="absolute inset-x-0 top-[49px] bottom-0 z-20 bg-white/95 backdrop-blur-sm p-4 animate-in slide-in-from-top-2 flex flex-col justify-center">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input type="text" placeholder="Client Name" value={client} onChange={e => setClient(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" required autoFocus />
            <input type="text" placeholder="Project / Scope" value={project} onChange={e => setProject(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" required />
            <div className="flex gap-2">
              <input type="number" placeholder="Days" value={days} onChange={e => setDays(e.target.value)} className="w-1/3 px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" required min="1" />
              <input type="text" placeholder="Target Date (e.g. Aug 12)" value={date} onChange={e => setDate(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" required />
            </div>
            <div className="flex justify-end mt-2">
              <button type="submit" className="bg-brand-accent text-brand-bg-secondary px-4 py-2 rounded-[4px] text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm">Save Milestone</button>
            </div>
          </form>
        </div>
      )}
"""
c = c.replace('<div className="p-4 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar">', add_milestone_form + '\n      <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar">')
with open(cal_file, 'w', encoding='utf-8') as f: f.write(c)

print("Forms updated to use absolute positioning overlays.")
