import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDeleteApiIntranetPostsId,
  useGetApiIntranetPosts,
  usePatchApiIntranetPostsId,
  usePostApiIntranetPosts,
  type getApiIntranetPostsResponse,
} from '../../api/generated/endpoints';
import type { CommunityPostResponseDto } from '@types';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { CollectionPanel } from '../common/dashboard/CollectionPanel';
import { ErrorAlert } from '../common/ui/ErrorAlert';
import { AnnouncementCard } from './announcements/AnnouncementCard';
import { AnnouncementCarousel } from './announcements/AnnouncementCarousel';
import { AnnouncementDetail } from './announcements/AnnouncementDetail';
import { AnnouncementFormModal } from './announcements/AnnouncementFormModal';

type PostsResponse = getApiIntranetPostsResponse;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

export function InternalAnnouncements() {
  const queryClient = useQueryClient();
  const { user, role } = useCurrentUser();
  const postsQuery = useGetApiIntranetPosts();
  const createMutation = usePostApiIntranetPosts();
  const updateMutation = usePatchApiIntranetPostsId();
  const deleteMutation = useDeleteApiIntranetPostsId();
  const [isExpandedView, setIsExpandedView] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPostResponseDto | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPostResponseDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const posts = postsQuery.data?.data ?? [];
  const canCreate = role === 'Admin' || role === 'Employee';
  const canManage = (post: CommunityPostResponseDto) =>
    role === 'Admin' || (!!user?.id && user.id === post.author?.id);

  const closeForm = () => {
    setIsCreateOpen(false);
    setEditingPost(null);
    setFormError(null);
  };

  const handleCreate = (title: string, body: string) => {
    setFormError(null);
    createMutation.mutate(
      { data: { title, body } },
      {
        onSuccess: () => {
          closeForm();
          queryClient.invalidateQueries({ queryKey: postsQuery.queryKey });
        },
        onError: error => setFormError(getErrorMessage(error, 'The announcement could not be published.')),
      },
    );
  };

  const handleUpdate = (title: string, body: string) => {
    if (!editingPost?.id) return;
    setFormError(null);
    updateMutation.mutate(
      { id: editingPost.id, data: { title, body } },
      {
        onSuccess: () => {
          closeForm();
          queryClient.invalidateQueries({ queryKey: postsQuery.queryKey });
        },
        onError: error => setFormError(getErrorMessage(error, 'The announcement could not be updated.')),
      },
    );
  };

  const handleDelete = (post: CommunityPostResponseDto) => {
    if (!post.id) return;
    const previous = queryClient.getQueryData<PostsResponse>(postsQuery.queryKey);
    setMutationError(null);
    setConfirmingDeleteId(null);
    queryClient.setQueryData<PostsResponse>(postsQuery.queryKey, current =>
      current ? { ...current, data: current.data.filter(item => item.id !== post.id) } : current,
    );

    deleteMutation.mutate(
      { id: post.id },
      {
        onError: error => {
          queryClient.setQueryData(postsQuery.queryKey, previous);
          setMutationError(getErrorMessage(error, 'The announcement could not be deleted.'));
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: postsQuery.queryKey }),
      },
    );
  };

  const renderPost = (post: CommunityPostResponseDto): ReactNode => {
    if (!post.id) return null;
    return (
      <AnnouncementCard
        key={post.id}
        post={post}
        canManage={canManage(post)}
        confirmingDelete={confirmingDeleteId === post.id}
        deleting={deleteMutation.isPending && deleteMutation.variables?.id === post.id}
        onOpen={() => setSelectedPost(post)}
        onEdit={() => {
          setConfirmingDeleteId(null);
          setFormError(null);
          setEditingPost(post);
        }}
        onRequestDelete={() => setConfirmingDeleteId(post.id || null)}
        onCancelDelete={() => setConfirmingDeleteId(null)}
        onConfirmDelete={() => handleDelete(post)}
      />
    );
  };

  const actions = (
    <div className="flex items-center gap-2">
      {canCreate && (
        <button type="button" onClick={() => { setFormError(null); setIsCreateOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary-container px-5 font-bold text-on-secondary-container transition-colors hover:m3-elevation-1">
          <Plus className="h-4 w-4" aria-hidden="true" /> New
        </button>
      )}
      {posts.length > 1 && (
        <button type="button" onClick={() => { setIsExpandedView(current => !current); setConfirmingDeleteId(null); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-base font-bold text-primary-inverse transition-colors hover:bg-surface-container hover:text-on-primary-container">
          {isExpandedView && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          {isExpandedView ? 'Back' : 'View all'}
        </button>
      )}
    </div>
  );

  return (
    <>
      <CollectionPanel title="Internal Announcements" actions={actions} className="relative flex h-full flex-col">
        {postsQuery.isLoading ? (
          <div className="flex items-start gap-8 overflow-hidden p-4" aria-label="Loading announcements">
            {[1, 2].map(item => <div key={item} className="w-[calc(100%-3.5rem)] max-w-[22rem] shrink-0 space-y-3 rounded-xl bg-surface-container p-4 animate-pulse">
              <div className="h-4 w-2/3 rounded bg-surface-container-high" />
              <div className="h-3 w-full rounded bg-surface-container-high" />
              <div className="h-3 w-4/5 rounded bg-surface-container-high" /></div>)}
          </div>
        ) : postsQuery.isError ? (
          <div className="p-4"><ErrorAlert title="Unable to load announcements" message="The announcement board is temporarily unavailable." /></div>
        ) : mutationError ? (
          <div className="p-4 pb-0"><ErrorAlert message={mutationError} onDismiss={() => setMutationError(null)} /></div>
        ) : posts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-semibold text-on-surface-variant">No announcements available.</div>
        ) : isExpandedView ? (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">{posts.map(renderPost)}</div>
        ) : (
          <AnnouncementCarousel>
            {posts.map(post => (
              <div key={post.id} data-announcement-card className="h-full min-w-0 snap-start">
                {renderPost(post)}
              </div>
            ))}
          </AnnouncementCarousel>
        )}

        {selectedPost && (
          <AnnouncementDetail
            post={selectedPost}
            canManage={canManage(selectedPost)}
            deleting={deleteMutation.isPending && deleteMutation.variables?.id === selectedPost.id}
            onClose={() => setSelectedPost(null)}
            onEdit={() => {
              setSelectedPost(null);
              setConfirmingDeleteId(null);
              setFormError(null);
              setEditingPost(selectedPost);
            }}
            onDelete={() => {
              const post = selectedPost;
              setSelectedPost(null);
              handleDelete(post);
            }}
          />
        )}
      </CollectionPanel>

      <AnnouncementFormModal
        mode={editingPost ? 'edit' : 'create'}
        isOpen={isCreateOpen || !!editingPost}
        isPending={editingPost ? updateMutation.isPending : createMutation.isPending}
        error={formError}
        initialTitle={editingPost?.title ?? ''}
        initialBody={editingPost?.body ?? ''}
        canDelete={!!editingPost && canManage(editingPost)}
        isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === editingPost?.id}
        onClose={closeForm}
        onSubmit={editingPost ? handleUpdate : handleCreate}
        onDelete={editingPost ? () => {
          const post = editingPost;
          closeForm();
          handleDelete(post);
        } : undefined}
      />
    </>
  );
}
