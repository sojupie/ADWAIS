interface EmptyStateProps {
  message: string;
  className?: string;
  isTableRow?: boolean;
  colSpan?: number;
}

export function EmptyState({ message, className = '', isTableRow = false, colSpan = 1 }: EmptyStateProps) {
  const content = (
    <div className={`text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl bg-white ${className}`}>
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
