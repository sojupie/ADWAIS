import type { ReactNode } from 'react';
import type { ComparisonPeriod } from '@types';
import { ChartSkeleton } from './ChartSkeleton';
import { Loader2 } from 'lucide-react';

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  comparison?: ComparisonPeriod;
  legend?: ReactNode;
  bodyClassName?: string;
  className?: string;
  isLoading?: boolean;
  isStale?: boolean;
  children: ReactNode;
}

export function ChartPanel({ title, subtitle, comparison, legend, bodyClassName = '', className = '', isLoading = false, isStale = false, children }: ChartPanelProps) {
    const displaySubtitle = subtitle || (comparison ? (comparison === 'YearOverYear' ? 'vs. Same Period Last Year' : 'vs. Preceding Period') : undefined);
    return (
        <div className={`bg-surface rounded-2xl ring-1 ring-slate-900/5 px-5 pt-4 flex flex-col min-h-[350px] contained:min-h-0 relative overflow-hidden ${className}`}>
            {isStale && !isLoading && (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] z-20 flex flex-col flex-wrap items-center justify-center animate-in fade-in duration-200">
                    <Loader2 size={32} className="text-brand animate-spin opacity-80" />
                    <span className="text-sm font-bold text-brand uppercase tracking-widest mt-2 bg-surface/80 px-2 py-1 rounded">Updating...</span>
                </div>
            )}
            <div className="flex justify-between items-start my-1 z-10">
                <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                    {title}
                </span>
                    {displaySubtitle && (
                        <span className="text-sm font-medium text-on-surface-variant">
                        {displaySubtitle}
                    </span>
                    )}
                </div>
                {legend}
            </div>
            <div className={`flex-1 min-h-[280px] contained:min-h-0 w-full flex flex-col z-10 relative ${bodyClassName}`}>
                {isLoading ? <ChartSkeleton /> : children}
            </div>
        </div>
    );
}
