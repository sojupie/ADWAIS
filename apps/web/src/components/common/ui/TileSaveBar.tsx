import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

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
  if (!isDirty && !isPending && !isSuccess && !isError) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-outline-variant animate-in fade-in duration-200">
      {isPending && (
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1.5 animate-pulse">
          <Loader2 className="animate-spin text-brand-link h-3.5 w-3.5" />
          <span>Saving updates to remote fleet (may take a long time if being rate limited)...</span>
        </div>
      )}

      {isSuccess && !isDirty && (
        <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5 animate-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="text-green-500 h-3.5 w-3.5" />
          <span>Updates saved successfully!</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 animate-in slide-in-from-top-1 duration-200">
          <XCircle className="text-red-500 h-3.5 w-3.5 animate-pulse" />
          <span className="truncate">{errorMsg || "Failed to save updates."}</span>
        </div>
      )}

      {isDirty && !isPending && (
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={onSave}
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
