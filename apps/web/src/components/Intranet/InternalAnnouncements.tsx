import { useState } from 'react';
import { CollectionPanel } from '../common/CollectionPanel';

const INITIAL_ANNOUNCEMENTS = [
  { id: 1, title: 'Motillo Summer Party 2026', date: 'May 28', summary: 'Please RSVP by Friday for the annual summer party. Food and drinks will be provided!' },
  { id: 2, title: 'New Fleet Status Matrix deployed', date: 'May 27', summary: 'Check out the new latency and SLA breach views in the dashboard.' },
  { id: 3, title: 'Welcome new hires', date: 'May 25', summary: 'Say hi to Erik and Sofia who joined the backend team this week.' },
  { id: 4, title: 'Q2 All-Hands Meeting', date: 'May 20', summary: 'Recording of the Q2 all-hands is now available on the company drive.' }
];

export function InternalAnnouncements() {
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    
    const newPost = {
      id: Date.now(),
      title: title.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      summary: summary.trim()
    };
    
    setAnnouncements([newPost, ...announcements]);
    setTitle('');
    setSummary('');
    setIsComposing(false);
  };

  return (
    <CollectionPanel 
      title="Internal Announcements" 
      className="h-full flex flex-col relative"
      actions={
        <button 
          onClick={() => setIsComposing(!isComposing)}
          className={`${isComposing ? 'bg-slate-200 text-slate-700' : 'bg-brand-bg-secondary text-white'} px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text hover:text-white transition-all shadow-sm cursor-pointer`}
        >
          {isComposing ? 'Cancel' : '+ New Post'}
        </button>
      }
    >
      {isComposing && (
        <div className="absolute inset-x-0 top-[49px] bottom-0 z-20 bg-white/95 backdrop-blur-sm p-4 animate-in slide-in-from-top-2 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 shrink-0">
          <input 
            type="text" 
            placeholder="Announcement Title" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
            autoFocus
          />
          <textarea 
            placeholder="Write your announcement..." 
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent custom-scrollbar"
          />
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={!title.trim() || !summary.trim()}
              className="bg-brand-accent text-brand-bg-secondary px-4 py-1.5 rounded-[4px] text-xs font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Post Announcement
            </button>
          </div>
          </form>
        </div>
      )}
      
      <div className="flex flex-col gap-4 p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {announcements.map(a => (
          <div key={a.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-sm font-bold text-slate-800">{a.title}</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 ml-2">{a.date}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{a.summary}</p>
          </div>
        ))}
      </div>
    </CollectionPanel>
  );
}
