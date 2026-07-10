import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { useGetApiIntranetPosts } from '../../api/generated/endpoints';

export function InternalAnnouncements() {
  const { data: response, isLoading, isError } = useGetApiIntranetPosts();
  const posts = response?.data || [];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-SE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <CollectionPanel
      title="Internal Announcements"
      className="h-full flex flex-col relative"
    >
      {isLoading ? (
        <div className="p-4 flex flex-col gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 border-b border-outline-variant pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-baseline mb-1">
                <div className="h-4 w-48 bg-surface-container-high rounded" />
                <div className="h-3 w-12 bg-surface-container-high rounded" />
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 text-center text-on-surface-variant text-sm font-semibold py-8">
          Failed to load announcements.
        </div>
      ) : posts.length === 0 ? (
        <div className="p-4 text-center text-on-surface-variant text-sm font-semibold py-8">
          No announcements available.
        </div>
      ) : (
        <div className="bg-surface flex flex-col p-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {posts.map((a) => (
            <div key={a.id} className="flex flex-col p-5 border-b border-outline-variant hover:bg-surface-container-low transition-colors last:border-b-0 cursor-default">
              <div className="flex justify-between items-baseline mb-2">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-base font-bold text-on-surface">{a.title || 'Untitled'}</h3>
                  {a.user?.name && (
                    <span className="text-sm text-on-surface-variant font-medium">by {a.user.name}</span>
                  )}
                </div>
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest shrink-0 ml-2">
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{a.body || ''}</p>
            </div>
          ))}
        </div>
      )}
    </CollectionPanel>
  );
}
