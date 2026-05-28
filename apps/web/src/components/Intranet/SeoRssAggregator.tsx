import { CollectionPanel } from '../common/CollectionPanel';

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
