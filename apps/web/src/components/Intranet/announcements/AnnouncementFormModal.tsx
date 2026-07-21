import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { ErrorAlert } from '../../common/ui/ErrorAlert';

interface AnnouncementFormModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  isPending: boolean;
  error: string | null;
  initialTitle?: string;
  initialBody?: string;
  canDelete?: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onSubmit: (title: string, body: string) => void;
  onDelete?: () => void;
}

type AnnouncementFormDialogProps = Omit<AnnouncementFormModalProps, 'isOpen'>;

function AnnouncementFormDialog({ mode, isPending, error, initialTitle = '', initialBody = '', canDelete = false, isDeleting = false, onClose, onSubmit, onDelete }: AnnouncementFormDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isEditing = mode === 'edit';
  const Icon = isEditing ? Pencil : Plus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !isPending && !isDeleting) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="announcement-form-title" onSubmit={event => { event.preventDefault(); onSubmit(title.trim(), body.trim()); }} className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-surface m3-elevation-4">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 id="announcement-form-title" className="flex items-center gap-4 text-xl font-bold text-on-surface">
            <Icon className="h-5 w-5 text-brand-link" aria-hidden="true" />
            {isEditing ? 'Edit announcement' : 'New announcement'}
          </h2>
          <button type="button" onClick={onClose} disabled={isPending || isDeleting} aria-label="Close announcement dialog" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high active:bg-surface-container-highest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          {error && <ErrorAlert title={isEditing ? 'Unable to update announcement' : 'Unable to create announcement'} message={error} />}
          <label className="flex flex-col gap-3 text-sm font-bold text-on-surface-variant">
            Title
            <input autoFocus required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} className="rounded-xl bg-surface-container px-4 py-3 text-base font-medium text-on-surface outline-none focus:bg-primary-container focus:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </label>
          <label className="flex flex-col gap-3 text-sm font-bold text-on-surface-variant">
            Message
            <textarea required maxLength={5000} rows={6} value={body} onChange={event => setBody(event.target.value)} className="resize-y rounded-xl bg-surface-container px-4 py-3 text-base font-medium text-on-surface outline-none focus:bg-primary-container focus:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </label>
        </div>

        {confirmingDelete ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container px-6 py-4 text-base text-on-surface">
            <span className="font-semibold">Delete this announcement?</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isDeleting} className="min-h-10 rounded-full px-4 text-base font-bold transition-colors hover:bg-surface-container-high active:bg-surface-container-highest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
              <button type="button" onClick={onDelete} disabled={isDeleting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-error px-5 text-base font-bold text-on-error transition-colors hover:bg-error/80 active:bg-error/80 focus-visible:bg-error/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:bg-error disabled:opacity-50">
                {isDeleting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-error border-t-transparent" aria-hidden="true" />}
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </footer>
        ) : (
          <footer className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4">
            <div>
              {isEditing && canDelete && <button type="button" onClick={() => setConfirmingDelete(true)} disabled={isPending || isDeleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-base font-bold text-error transition-colors hover:bg-error-container active:bg-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete</button>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isPending || isDeleting} className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-base font-bold text-on-surface transition-colors hover:bg-surface-container-high active:bg-surface-container-highest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isPending || isDeleting} className="inline-flex min-h-11 items-center justify-center gap-4 rounded-full bg-primary-container px-5 text-base font-bold text-on-primary-container transition-shadow hover:m3-elevation-1 active:m3-elevation-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:opacity-30">
                {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-outline border-t-on-primary-container" aria-hidden="true" />}
                {isPending ? (isEditing ? 'Saving…' : 'Publishing…') : (isEditing ? 'Save changes' : 'Publish')}
              </button>
            </div>
          </footer>
        )}
      </form>
    </div>
  );
}

export function AnnouncementFormModal({ isOpen, ...dialogProps }: AnnouncementFormModalProps) {
  if (!isOpen) return null;
  return <AnnouncementFormDialog {...dialogProps} />;
}
