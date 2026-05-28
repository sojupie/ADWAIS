import os

base_dir = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\Intranet'
os.makedirs(base_dir, exist_ok=True)

announcements_code = """import { CollectionPanel } from '../common/CollectionPanel';

const announcements = [
  { id: 1, title: 'Motillo Summer Party 2026', date: 'May 28', summary: 'Please RSVP by Friday for the annual summer party. Food and drinks will be provided!' },
  { id: 2, title: 'New Fleet Status Matrix deployed', date: 'May 27', summary: 'Check out the new latency and SLA breach views in the dashboard.' },
  { id: 3, title: 'Welcome new hires', date: 'May 25', summary: 'Say hi to Erik and Sofia who joined the backend team this week.' },
  { id: 4, title: 'Q2 All-Hands Meeting', date: 'May 20', summary: 'Recording of the Q2 all-hands is now available on the company drive.' }
];

export function InternalAnnouncements() {
  return (
    <CollectionPanel title="Internal Announcements" className="h-full">
      <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto custom-scrollbar">
        {announcements.map(a => (
          <div key={a.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
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
"""

calendar_code = """import { CollectionPanel } from '../common/CollectionPanel';

const milestones = [
  { id: 1, client: 'Intersport', project: 'Checkout V2', days: 2, date: 'May 30' },
  { id: 2, client: 'Granngården', project: 'PIM Migration', days: 12, date: 'Jun 9' },
  { id: 3, client: 'Motillo Platform', project: 'Q2 Security Patch', days: 18, date: 'Jun 15' },
  { id: 4, client: 'Jula', project: 'B2B Portal Launch', days: 34, date: 'Jul 1' }
];

export function GoLiveCalendar() {
  return (
    <CollectionPanel title="E-Commerce Go-Live Calendar" className="h-full">
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
"""

rss_code = """import { CollectionPanel } from '../common/CollectionPanel';

const news = [
  { id: 1, source: 'Search Engine Land', title: 'Google confirms May 2026 core update is rolling out', time: '2h ago' },
  { id: 2, source: 'Litium Release Notes', title: 'Litium 8.16 introduced with new headless APIs', time: '5h ago' },
  { id: 3, source: 'Vercel', title: 'Next.js 16 Compiler stabilizes for production', time: '1d ago' },
  { id: 4, source: 'SEJ', title: 'Core Web Vitals INP metric impact analysis', time: '1d ago' },
  { id: 5, source: 'Motillo Tech Blog', title: 'How we migrated 50M rows with zero downtime', time: '2d ago' },
  { id: 6, source: 'NPM Security', title: 'Critical vulnerability patched in popular react ecosystem package', time: '3d ago' },
];

export function SeoRssAggregator() {
  return (
    <CollectionPanel title="SEO & Tech Radar" className="h-full relative overflow-hidden">
      <div className="p-4 flex flex-col gap-5 animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused]">
        <style>{`
          @keyframes scroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}</style>
        {news.map(n => (
          <div key={n.id} className="flex flex-col gap-1 border-l-2 border-brand-accent pl-3">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-black text-brand-btn-primary uppercase tracking-widest">{n.source}</span>
              <span className="text-[10px] text-slate-400 font-bold shrink-0">{n.time}</span>
            </div>
            <span className="text-sm font-bold text-slate-700 leading-snug">{n.title}</span>
          </div>
        ))}
        {news.map(n => (
          <div key={`dup-${n.id}`} className="flex flex-col gap-1 border-l-2 border-brand-accent pl-3">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-black text-brand-btn-primary uppercase tracking-widest">{n.source}</span>
              <span className="text-[10px] text-slate-400 font-bold shrink-0">{n.time}</span>
            </div>
            <span className="text-sm font-bold text-slate-700 leading-snug">{n.title}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      <div className="absolute top-12 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none" />
    </CollectionPanel>
  );
}
"""

social_code = """import { CollectionPanel } from '../common/CollectionPanel';

export function AgencySocialWall() {
  return (
    <CollectionPanel title="Agency Social Wall" className="h-full">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded bg-[#0077b5] text-white flex items-center justify-center font-bold text-lg shadow-sm">in</div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">Motillo AB</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">2 days ago &bull; LinkedIn</span>
          </div>
        </div>
        
        <p className="text-sm text-slate-700 mb-4 line-clamp-3 leading-relaxed">
          We're incredibly proud to announce that our work with Granngården has won the "E-commerce of the Year" award! Massive thanks to the entire team for pushing the boundaries of headless commerce and delivering exceptional digital experiences. 🏆🚀
        </p>
        
        <div className="flex-1 min-h-[200px] bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
           <div className="absolute inset-0 bg-gradient-to-br from-brand-bg-secondary to-brand-btn-primary flex items-center justify-center">
             <span className="text-7xl drop-shadow-lg">🎉🏆</span>
           </div>
        </div>
        
        <div className="flex gap-6 mt-4 text-xs font-bold text-slate-500 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1.5"><span className="text-base">👍</span> 142 Likes</span>
          <span className="flex items-center gap-1.5"><span className="text-base">💬</span> 18 Comments</span>
          <span className="flex items-center gap-1.5"><span className="text-base">🔄</span> 5 Reposts</span>
        </div>
      </div>
    </CollectionPanel>
  );
}
"""

office_code = """import { useState, useEffect } from 'react';

const events = [
  { id: 1, time: '14:00', title: 'Tech Sync', location: 'Conf Room A' },
  { id: 2, time: '15:00', title: 'Fika', location: 'Kitchen' },
  { id: 3, time: '16:30', title: 'Client Demo', location: 'Zoom' }
];

export function OfficeContext() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const secondsString = time.getSeconds().toString().padStart(2, '0');

  return (
    <section className="rounded-xl shadow-sm flex flex-col overflow-hidden bg-brand-bg-secondary text-white h-full relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 2L2 22H22L12 2Z" />
         </svg>
      </div>
      
      <div className="p-6 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-xs font-black text-brand-accent uppercase tracking-widest mb-1">{dateString}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl lg:text-6xl font-black tracking-tighter">{timeString}</span>
              <span className="text-xl font-bold text-white/50">:{secondsString}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl lg:text-4xl">🌤️</span>
            <span className="text-lg font-bold mt-1">18°C</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Karlstad</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Today's Schedule</h3>
            <span className="text-[10px] font-bold text-white/40">{events.length} Events</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                <span className="text-sm font-black text-brand-accent w-12 shrink-0 text-right">{e.time}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-tight">{e.title}</span>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{e.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
"""

intranet_code = """import { InternalAnnouncements } from '../components/Intranet/InternalAnnouncements';
import { GoLiveCalendar } from '../components/Intranet/GoLiveCalendar';
import { SeoRssAggregator } from '../components/Intranet/SeoRssAggregator';
import { AgencySocialWall } from '../components/Intranet/AgencySocialWall';
import { OfficeContext } from '../components/Intranet/OfficeContext';

export function Intranet() {
  return (
    <div className="flex-1 w-full custom-scrollbar overflow-y-auto px-6 py-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Motillo Intranet</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Internal operations and context board.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[420px]">
        {/* Tile 6: Office Context - span 1 */}
        <div className="col-span-1">
          <OfficeContext />
        </div>
        
        {/* Tile 1: Announcements - span 1 */}
        <div className="col-span-1">
          <InternalAnnouncements />
        </div>
        
        {/* Tile 2: Go-Live Calendar - span 1 */}
        <div className="col-span-1">
          <GoLiveCalendar />
        </div>
        
        {/* Tile 4: SEO RSS - span 1 */}
        <div className="col-span-1">
          <SeoRssAggregator />
        </div>
        
        {/* Tile 5: Agency Social Wall - span 1 or 2 */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2">
          <AgencySocialWall />
        </div>
      </div>
    </div>
  );
}
"""

with open(os.path.join(base_dir, 'InternalAnnouncements.tsx'), 'w', encoding='utf-8') as f: f.write(announcements_code)
with open(os.path.join(base_dir, 'GoLiveCalendar.tsx'), 'w', encoding='utf-8') as f: f.write(calendar_code)
with open(os.path.join(base_dir, 'SeoRssAggregator.tsx'), 'w', encoding='utf-8') as f: f.write(rss_code)
with open(os.path.join(base_dir, 'AgencySocialWall.tsx'), 'w', encoding='utf-8') as f: f.write(social_code)
with open(os.path.join(base_dir, 'OfficeContext.tsx'), 'w', encoding='utf-8') as f: f.write(office_code)
with open(r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\Intranet.tsx', 'w', encoding='utf-8') as f: f.write(intranet_code)

print("Intranet components generated successfully.")
