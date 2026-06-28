import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { useGetApiIntranetFeeds } from '../../api/generated/endpoints';

export function SeoRssAggregator() {
  const { data: response, isLoading } = useGetApiIntranetFeeds({ PageSize: 10, AuthorName: 'litium' });
  const feedItems = response?.data || [];

  return (
    <CollectionPanel title="Litium News – Click to read" className="h-full relative overflow-hidden">
      {isLoading ? (
        <div className="p-4 flex flex-col gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 border-l-2 border-slate-200 pl-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-sm font-semibold py-8">
          No feeds available.
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-2 animate-[scroll_10s_ease-in-out_infinite_alternate] hover:[animation-play-state:paused]">
          <style>{`
            @keyframes scroll {
              0% { transform: translateY(5%); }
              100% { transform: translateY(-30%); }
            }
          `}</style>
          {feedItems.map(item => (
            <div key={item.id} className="flex flex-col gap-1 border-l-2 border-brand-accent pl-3">
              <div className="flex justify-between items-center mb-0.5">
                <a href={item.feedSource?.url || undefined} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline underline-offset-2 font-black text-brand-btn-primary uppercase tracking-widest">
                  {item.feedSource?.name || 'Feed'}
                </a>
                <span className="text-sm text-slate-400 font-bold shrink-0">
                  {item.publishDate ? new Date(item.publishDate).toLocaleDateString() : ''}
                </span>
              </div>
              <a href={item.link || undefined} target="_blank" rel="noopener noreferrer" className="underline-offset-2 text-sm font-bold text-slate-700 leading-snug hover:underline transition-colors">
                {item.title || ''}
              </a>
            </div>
          ))}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      <div className="absolute top-12 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none" />
    </CollectionPanel>
  );
}

