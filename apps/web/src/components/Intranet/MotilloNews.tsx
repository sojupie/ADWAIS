import { useState } from 'react';
import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { useGetApiIntranetFeeds } from '../../api/generated/endpoints';

export function MotilloNews() {
  const { data: response, isLoading } = useGetApiIntranetFeeds({ PageSize: 20, AuthorName: 'motillo' });
  const feedItems = response?.data || [];

  const [selectedPostId, setSelectedPostId] = useState<string | undefined>(undefined);

  const selectedPost = feedItems.find((p) => p.id === selectedPostId) || feedItems[0];

  return (
    <CollectionPanel title="Motillo News" className="h-full relative">
      {isLoading ? (
        <div className="flex flex-col md:flex-row h-full animate-pulse">
          {/* Skeleton Sidebar */}
          <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col p-4 gap-4 bg-slate-50/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          {/* Skeleton Detail */}
          <div className="flex-1 flex flex-col p-6 gap-4">
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/4 bg-slate-200 rounded" />
            <div className="h-20 w-full bg-slate-200 rounded" />
            <div className="w-full flex-1 min-h-[150px] bg-slate-200 rounded-lg" />
          </div>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="p-8 text-center text-slate-400 font-semibold py-12">
          No news available.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Sidebar List */}
          <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col overflow-y-auto custom-scrollbar bg-slate-50/50 min-h-0">
            {feedItems.map((post) => {
              const isSelected = selectedPost?.id === post.id;
              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className={`flex flex-col text-left p-4 border-b border-slate-100 transition-colors cursor-pointer hover:bg-white ${
                    isSelected ? 'bg-white border-l-4 border-l-brand-accent shadow-sm' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-bold line-clamp-2 leading-relaxed hover:text-brand-accent transition-colors">
                    {post.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail View */}
          <div className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto custom-scrollbar">
            {selectedPost && (
              <>
                <div className="flex flex-col gap-1 mb-4 shrink-0">
                  <a
                    href={selectedPost.link || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-black text-slate-900 leading-snug hover:text-brand-accent transition-colors"
                  >
                    {selectedPost.title}
                  </a>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    {selectedPost.publishDate ? new Date(selectedPost.publishDate).toLocaleDateString() : ''} 
                    {selectedPost.author ? ` • ${selectedPost.author}` : ''}
                    {selectedPost.feedSource?.name ? ` • ${selectedPost.feedSource.name}` : ''}
                  </div>
                </div>

                {selectedPost.content && (
                  <p className="text-sm text-slate-700 mb-6 leading-relaxed whitespace-pre-line">
                    {selectedPost.content}
                  </p>
                )}

                {selectedPost.imageUrl && (
                  <div className="w-full flex-1 min-h-[200px] max-h-[400px] rounded-lg overflow-hidden relative border border-slate-200 shadow-sm shrink-0 animate-in fade-in duration-300 mb-4">
                    <img
                      src={selectedPost.imageUrl}
                      className="w-full h-full object-cover"
                      alt={selectedPost.title || 'News image'}
                    />
                  </div>
                )}
                
                {selectedPost.link && (
                  <div className="mt-2 shrink-0">
                    <a
                      href={selectedPost.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-slate-900 text-white hover:bg-brand-accent transition-colors px-4 py-2 rounded text-sm font-bold uppercase tracking-wider"
                    >
                      Read Full Article
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </CollectionPanel>
  );
}
