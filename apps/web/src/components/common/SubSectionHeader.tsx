import type { ReactNode } from 'react';

interface SubSectionHeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function SubSectionHeader({ title, subtitle, icon, children, className = '' }: SubSectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-link/10 text-brand-link rounded-lg shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="text-md font-bold text-brand-text leading-tight">{title}</h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
