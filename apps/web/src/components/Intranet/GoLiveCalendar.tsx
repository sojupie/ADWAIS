import { useState } from 'react';
import { CollectionPanel } from '../common/CollectionPanel';

const INITIAL_MILESTONES = [
  { id: 1, client: 'Intersport', project: 'Checkout V2', days: 2, date: 'May 30' },
  { id: 2, client: 'Granngården', project: 'PIM Migration', days: 12, date: 'Jun 9' },
  { id: 3, client: 'Motillo Platform', project: 'Q2 Security Patch', days: 18, date: 'Jun 15' },
  { id: 4, client: 'Jula', project: 'B2B Portal Launch', days: 34, date: 'Jul 1' }
];

export function GoLiveCalendar() {
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [isAdding, setIsAdding] = useState(false);
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [date, setDate] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !project.trim() || !date) return;
    
    const targetDate = new Date(date);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    setMilestones([...milestones, {
      id: Date.now(),
      client: client.trim(),
      project: project.trim(),
      days: calculatedDays,
      date: formattedDate
    }].sort((a, b) => a.days - b.days));
    
    setClient(''); setProject(''); setDate('');
    setIsAdding(false);
  };

  return (
    <CollectionPanel 
      title="E-Commerce Go-Live Calendar" 
      className="h-full relative"
      actions={
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`${isAdding ? 'bg-slate-200 text-slate-700' : 'bg-brand-bg-secondary text-white'} px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text hover:text-white transition-all shadow-sm cursor-pointer`}
        >
          {isAdding ? 'Cancel' : '+ Milestone'}
        </button>
      }
    >
      
      {isAdding && (
        <div className="absolute inset-x-0 top-[49px] bottom-0 z-20 bg-white/95 backdrop-blur-sm p-4 animate-in slide-in-from-top-2 flex flex-col justify-center">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input type="text" placeholder="Client Name" value={client} onChange={e => setClient(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" required autoFocus />
            <input type="text" placeholder="Project / Scope" value={project} onChange={e => setProject(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" required />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-slate-700" required />
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-700 px-4 py-2 font-black uppercase tracking-widest text-xs transition-colors">Cancel</button>
              <button type="submit" className="bg-brand-accent text-brand-bg-secondary px-4 py-2 rounded-[4px] text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm">Save Milestone</button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-accent transition-colors">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.client}</span>
              <span className="text-sm font-bold text-slate-800">{m.project}</span>
              <span className="text-xs text-slate-400 font-medium">{m.date}</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-brand-bg-secondary text-white w-14 h-14 rounded-full shadow-sm shrink-0">
              <span className="text-lg font-black leading-none">{m.days}</span>
              <span className="text-[8px] uppercase tracking-widest mt-0.5 opacity-80">Days</span>
            </div>
          </div>
        ))}
      </div>
    </CollectionPanel>
  );
}
