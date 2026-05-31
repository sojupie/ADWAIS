interface TileSaveBarProps {
  isDirty: boolean;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function TileSaveBar({ isDirty, isPending, onSave, onCancel }: TileSaveBarProps) {
  if (!isDirty) return null;

  return (
    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onSave}
        disabled={isPending}
        className="flex-1 bg-brand-link text-white font-bold text-xs py-1.5 rounded-lg hover:bg-brand-link/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Changes
      </button>
      <button
        onClick={onCancel}
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
    </div>
  );
}
