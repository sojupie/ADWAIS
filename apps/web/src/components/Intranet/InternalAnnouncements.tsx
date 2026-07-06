import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { useGetApiIntranetPosts } from '../../api/generated/endpoints';

export function InternalAnnouncements() {
  const { data: response, isLoading, isError } = useGetApiIntranetPosts();
  const posts = response?.data || [];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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
            <div key={i} className="flex flex-col gap-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-baseline mb-1">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-12 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 text-center text-slate-400 text-sm font-semibold py-8">
          Failed to load announcements.
        </div>
      ) : posts.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-sm font-semibold py-8">
          No announcements available.
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4 flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {posts.map((a) => (
            <div key={a.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-bold text-slate-800">{a.title || 'Untitled'}</h3>
                  {a.user?.name && (
                    <span className="text-xs text-slate-400 font-medium">by {a.user.name}</span>
                  )}
                </div>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest shrink-0 ml-2">
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{a.body || ''}</p>
            </div>
          ))}
        </div>
      )}
    </CollectionPanel>
  );
}
