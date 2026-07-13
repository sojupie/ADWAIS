import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { useGetApiIntranetFeeds } from '../../api/generated/endpoints';
import {ExternalLink} from "lucide-react";

export function SeoRssAggregator() {
  const { data: response, isLoading } = useGetApiIntranetFeeds({ PageSize: 10, AuthorName: 'litium' });
  const feedItems = response?.data || [];

  return (
    <CollectionPanel title="Litium News – Click to read" className="h-full relative overflow-hidden pb-4 rounded-2xl">
      {isLoading ? (
        <div className="flex flex-col animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 p-5 border-b border-outline-variant last:border-b-0">
              <div className="h-3 w-24 bg-surface-container-high rounded" />
              <div className="h-4 w-full bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <div className="p-4 text-center text-on-surface-variant text-sm font-semibold py-8">
          No feeds available.
        </div>
      ) : (
        <div className="flex flex-col p-0 flex-1 gap-1 min-h-0 overflow-y-auto custom-scrollbar px-4">
          {feedItems.map(item => (
            <div key={item.id} className="flex rounded-xl flex-col gap-1.5 p-4 bg-surface-container hover:bg-surface-container-high transition-colors">
              <div className="flex justify-between items-center mb-0.5">
                <a href={item.feedSource?.url || undefined} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline underline-offset-2 font-black text-brand-btn-primary uppercase tracking-widest">
                  {item.feedSource?.name || 'Feed'}
                </a>
                <span className="text-xs text-on-surface-variant font-bold shrink-0">
                  {item.publishDate ? new Date(item.publishDate).toLocaleDateString() : ''}
                </span>
              </div>
              <div className={"flex gap-1 justify-between items-center"}>
                <a href={item.link || undefined} target="_blank" rel="noopener noreferrer" className="underline-offset-2 text-left text-sm font-bold text-on-surface-variant leading-snug hover:underline transition-colors block">
                  {item.title || ''}
                </a>
                <ExternalLink size={18}/>
              </div>
            </div>
          ))}
        </div>
      )}
      {/*<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />*/}
      {/*<div className="absolute top-8 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none" />*/}
    </CollectionPanel>
  );
}

