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
    <div className={`border border-outline-variant rounded-xl overflow-hidden hover:border-outline-variant transition-all bg-surface shadow-sm shrink-0 flex flex-col ${className}`}>
      <div className={`flex items-center justify-between p-3 border-b ${isUnassigned ? 'bg-surface-container-low border-orange-100' : 'bg-surface-container-low border-outline-variant'}`}>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {header}
        </div>
        {headerActions && (
          <div className="flex items-center gap-1 ml-2">
            {headerActions}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 bg-surface">
        {children}
      </div>
    </div>
  );
}
