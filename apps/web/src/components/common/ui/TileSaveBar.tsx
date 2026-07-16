import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ErrorAlert } from './ErrorAlert';

interface TileSaveBarProps {
  isDirty: boolean;
  isPending: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMsg?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function TileSaveBar({
  isDirty,
  isPending,
  isSuccess,
  isError,
  errorMsg,
  onSave,
  onCancel
}: TileSaveBarProps) {
  const [dismissedErrorMessage, setDismissedErrorMessage] = useState<string | null>(null);
  const resolvedErrorMessage = errorMsg || 'Failed to save updates.';
  const isErrorDismissed = isError && dismissedErrorMessage === resolvedErrorMessage;

  if (!isDirty && !isPending && !isSuccess && (!isError || isErrorDismissed)) return null;

  const handleSave = () => {
    setDismissedErrorMessage(null);
    onSave();
  };

  return (
    <div className="flex flex-col gap-4 mt-2 pt-3 border-t border-outline-variant animate-in fade-in duration-200">
      {isPending && (
        <div className="flex items-center gap-4 text-sm font-semibold text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1.5 animate-pulse">
          <Loader2 className="animate-spin text-brand-link h-3.5 w-3.5" />
          <span>Saving updates to remote fleet (may take a long time if being rate limited)...</span>
        </div>
      )}

      {isSuccess && !isDirty && (
        <div className="flex items-center gap-4 text-sm font-bold text-growth bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 animate-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="text-growth h-3.5 w-3.5" />
          <span>Updates saved successfully!</span>
        </div>
      )}

      {isError && !isErrorDismissed && (
        <ErrorAlert
          title="Unable to save changes"
          message={resolvedErrorMessage}
          onDismiss={() => setDismissedErrorMessage(resolvedErrorMessage)}
        />
      )}

      {isDirty && !isPending && (
        <div className="flex items-center gap-4 w-full">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 bg-brand-btn-primary text-white font-bold text-sm py-1.5 rounded-lg hover:bg-brand-btn-quaternary transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
