import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InternalAnnouncements } from './InternalAnnouncements';

const post = {
  id: 'post-1',
  title: 'Office update',
  body: 'The full announcement body.',
  createdAt: '2026-07-15T10:00:00Z',
  author: { id: 'author-1', name: 'Jane Doe' },
};

const secondPost = { ...post, id: 'post-2', title: 'Second update' };

const queryState = {
  data: { data: [post] },
  isLoading: false,
  isError: false,
  queryKey: ['/api/intranet/posts'],
};

const createMutation = {
  isPending: false,
  mutate: vi.fn(),
};

const deleteMutation = {
  isPending: false,
  variables: undefined as { id: string } | undefined,
  mutate: vi.fn(),
};

const updateMutation = {
  isPending: false,
  mutate: vi.fn(),
};

const invalidateQueries = vi.fn();
const setQueryData = vi.fn();

vi.mock('../../api/generated/endpoints', () => ({
  useGetApiIntranetPosts: () => queryState,
  usePostApiIntranetPosts: () => createMutation,
  usePatchApiIntranetPostsId: () => updateMutation,
  useDeleteApiIntranetPostsId: () => deleteMutation,
}));

vi.mock('../../hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { id: 'author-1', name: 'Jane Doe', role: 'Employee' },
    role: 'Employee',
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries,
      getQueryData: () => queryState.data,
      setQueryData,
    }),
  };
});

describe('InternalAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState.data = { data: [post] };
    createMutation.isPending = false;
    deleteMutation.isPending = false;
    deleteMutation.variables = undefined;
    updateMutation.isPending = false;
  });

  it('opens the edit modal with the existing values and patches the announcement', () => {
    render(<InternalAnnouncements />);

    fireEvent.click(screen.getByLabelText('Edit Office update'));
    const title = screen.getByLabelText('Title');
    const message = screen.getByLabelText('Message');
    expect(title).toHaveValue('Office update');
    expect(message).toHaveValue('The full announcement body.');

    fireEvent.change(title, { target: { value: 'Updated office update' } });
    fireEvent.change(message, { target: { value: 'Updated announcement body.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateMutation.mutate).toHaveBeenCalledWith(
      { id: 'post-1', data: { title: 'Updated office update', body: 'Updated announcement body.' } },
      expect.any(Object),
    );
  });

  it('opens the create modal and submits the entered announcement', () => {
    render(<InternalAnnouncements />);

    fireEvent.click(screen.getByRole('button', { name: /new/i }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New title' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'New body' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(createMutation.mutate).toHaveBeenCalledWith(
      { data: { title: 'New title', body: 'New body' } },
      expect.any(Object),
    );
  });

  it('opens an announcement in a contained detail dialog and switches to the full list view', () => {
    queryState.data = { data: [post, secondPost] };
    render(<InternalAnnouncements />);

    const card = screen.getAllByRole('button', { name: /office update/i })[0];
    if (!card) throw new Error('Announcement card was not rendered');
    fireEvent.click(card);
    expect(screen.getByRole('dialog', { name: 'Office update' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close announcement' }));

    fireEvent.click(screen.getByRole('button', { name: /view all/i }));
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('requires confirmation before deleting an announcement', () => {
    render(<InternalAnnouncements />);

    fireEvent.click(screen.getByLabelText('Delete Office update'));
    expect(screen.getByText('Delete this announcement?')).toBeInTheDocument();
    expect(deleteMutation.mutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/ }));
    expect(deleteMutation.mutate).toHaveBeenCalledWith(
      { id: 'post-1' },
      expect.any(Object),
    );
  });

  it('restores the announcement when optimistic deletion fails', () => {
    render(<InternalAnnouncements />);

    fireEvent.click(screen.getByLabelText('Delete Office update'));
    fireEvent.click(screen.getByRole('button', { name: /^Delete$/ }));

    const options = deleteMutation.mutate.mock.calls[0]?.[1];
    options?.onError?.(new Error('Delete failed'));
    options?.onSettled?.();

    expect(setQueryData).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalled();
  });
});
