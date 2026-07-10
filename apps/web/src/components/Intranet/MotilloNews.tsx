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
          <div className="flex flex-row md:flex-col w-full md:w-1/3 flex-shrink-0 p-4 gap-4 bg-surface md:border-r md:border-outline-variant/60 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2 p-4 w-[280px] md:w-auto flex-shrink-0 rounded-xl bg-surface-container/50">
                <div className="h-3 w-20 bg-surface-container-high rounded-full" />
                <div className="h-4 w-full bg-surface-container-high rounded-full" />
                <div className="h-4 w-2/3 bg-surface-container-high rounded-full" />
              </div>
            ))}
          </div>
          {/* Skeleton Detail */}
          <div className="flex-1 flex flex-col p-6 gap-4">
            <div className="h-6 w-3/4 bg-surface-container-high rounded" />
            <div className="h-3 w-1/4 bg-surface-container-high rounded" />
            <div className="h-20 w-full bg-surface-container-high rounded" />
            <div className="w-full flex-1 min-h-[150px] bg-surface-container-high rounded-lg" />
          </div>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant font-semibold py-12">
          No news available.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Sidebar List (Surface Container Low) */}
          <div className="flex flex-row md:flex-col w-full md:w-1/3 md:h-full flex-shrink-0 p-4 gap-2 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto custom-scrollbar bg-surface md:border-r md:border-outline-variant/60 snap-x scroll-px-4">
            {feedItems.map((post) => {
              const isSelected = selectedPost?.id === post.id;
              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className={`flex flex-col text-left p-4 rounded-xl transition-all w-[280px] md:w-auto flex-shrink-0 snap-start ${
                    isSelected ? 'bg-primary-container' : 'bg-transparent hover:bg-brand-btn-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold tracking-wide ${isSelected ? 'text-brand-btn-primary' : 'text-on-surface-variant'}`}>
                      {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className={`text-base leading-snug transition-colors ${isSelected ? 'text-on-surface font-bold' : 'text-on-surface-variant font-semibold'}`}>
                    {post.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail View (Surface) */}
          <div className="flex-1 flex flex-col p-5 md:p-8 min-h-0 overflow-y-auto custom-scrollbar bg-surface">
            {selectedPost && (
              <>
                <div className="flex flex-col gap-1 mb-4 shrink-0">
                  <a
                      href={selectedPost.link || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl md:text-3xl font-black text-brand-text leading-tight hover:underline underline-offset-2"
                  >
                    {selectedPost.title}
                  </a>
                  <div className="text-sm text-on-surface-variant font-bold uppercase tracking-widest">
                    {selectedPost.publishDate ? new Date(selectedPost.publishDate).toLocaleDateString() : ''}
                    {selectedPost.author ? ` • ${selectedPost.author}` : ''}
                    {selectedPost.feedSource?.name && (
                      <>
                        {' • '}
                        <a
                          href={selectedPost.feedSource.url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline underline-offset-2"
                        >
                          {selectedPost.feedSource.name}
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {selectedPost.content && (
                  <p className="text-sm text-brand-text mb-6 leading-relaxed whitespace-pre-line">
                    {selectedPost.content}
                  </p>
                )}

                {selectedPost.imageUrl && (
                  <div className="w-full flex-1 min-h-[200px] max-h-[400px] rounded-lg overflow-hidden relative border border-outline-variant shadow-sm shrink-0 animate-in fade-in duration-300 mb-4">
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
                      className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white text-sm font-bold m3-elevation-1 hover:m3-elevation-2 transition-all"
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
