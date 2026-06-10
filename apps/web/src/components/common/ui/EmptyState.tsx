interface EmptyStateProps {
  message: string;
  className?: string;
  isTableRow?: boolean;
  colSpan?: number;
  variant?: 'default' | 'minimal';
}

export function EmptyState({ message, className = '', isTableRow = false, colSpan = 1, variant = 'default' }: EmptyStateProps) {
  const baseClasses = variant === 'default' 
    ? "text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl bg-white"
    : "flex items-center justify-center h-full w-full text-xs font-bold text-slate-500 uppercase tracking-widest text-center p-4";

  const content = (
    <div className={`${baseClasses} ${className}`}>
      {message}
    </div>
  );

  if (isTableRow) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}
