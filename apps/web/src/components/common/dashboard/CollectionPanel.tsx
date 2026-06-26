import { ChartSkeleton } from '../charts/ChartSkeleton';
import type { ReactNode } from 'react';

interface CollectionPanelProps {
  title: string;
  actions?: ReactNode;
  className?: string;
  isLoading?: boolean;
  children: ReactNode;
}

export function CollectionPanel({ title, actions, className = '', isLoading, children }: CollectionPanelProps) {
  return (
    <section className={`bg-white rounded-xl border border-slate-200 shadow-sm p-0 flex flex-col min-h-0 overflow-hidden max-h-[600px] xl:max-h-none contained:max-h-none landscape-lg:max-h-none ${className}`}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest m-0">
          {title}
        </h2>
        {actions && (
          <div className="flex items-center gap-4">
            {actions}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {isLoading ? <ChartSkeleton /> : children}
      </div>
    </section>
  );
}
