import type { ReactNode } from 'react';

interface TileCardProps {
  header: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  isUnassigned?: boolean;
  className?: string;
}

export function TileCard({
  header,
  headerActions,
  children,
  isUnassigned = false,
  className = '',
}: TileCardProps) {
  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all bg-white shadow-sm shrink-0 flex flex-col ${className}`}>
      <div className={`flex items-center justify-between p-3 border-b ${isUnassigned ? 'bg-slate-50 border-orange-100' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {header}
        </div>
        {headerActions && (
          <div className="flex items-center gap-1 ml-2">
            {headerActions}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 bg-white">
        {children}
      </div>
    </div>
  );
}
