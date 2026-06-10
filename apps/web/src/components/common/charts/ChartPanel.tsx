import type { ReactNode } from 'react';
import { ChartSkeleton } from './ChartSkeleton';
import { Loader2 } from 'lucide-react';

interface ChartPanelProps {
  title: string;
  legend?: ReactNode;
  bodyClassName?: string;
  className?: string;
  isLoading?: boolean;
  isStale?: boolean;
  children: ReactNode;
}

export function ChartPanel({ title, legend, bodyClassName = '', className = '', isLoading = false, isStale = false, children }: ChartPanelProps) {
  return (
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-4 flex flex-col h-full min-h-0 relative overflow-hidden ${className}`} style={{ contain: 'layout style paint', contentVisibility: 'auto', containIntrinsicSize: 'auto 350px' }}>
        {isStale && !isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
               <Loader2 size={32} className="text-brand-accent animate-spin opacity-80" />
               <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mt-2 bg-white/80 px-2 py-1 rounded">Updating...</span>
            </div>
        )}
        <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {title}
            </span>
            {legend}
        </div>
        <div className={`flex-1 min-h-0 w-full h-full flex flex-col z-10 ${bodyClassName}`}>
            {isLoading ? <ChartSkeleton /> : children}
        </div>
      </div>
  );
}