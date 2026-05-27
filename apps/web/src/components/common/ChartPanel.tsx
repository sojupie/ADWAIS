import type { ReactNode } from 'react';

interface ChartPanelProps {
  title: string;
  legend?: ReactNode;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}

export function ChartPanel({ title, legend, bodyClassName = '', className = '', children }: ChartPanelProps) {
  return (
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-4 flex flex-col min-h-0 ${className}`}>
        <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {title}
            </span>
            {legend}
        </div>
        <div className={`flex-1 min-h-0 w-full h-full flex flex-col ${bodyClassName}`}>
            {children}
        </div>
      </div>
  );
}
