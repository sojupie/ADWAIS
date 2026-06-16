import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children?: ReactNode;
  className?: string;
  dark?: boolean;
}

export function SectionHeader({ title, subtitle, icon, children, className = '', dark = true }: SectionHeaderProps) {
  const bgClass = dark ? 'bg-brand-bg-secondary border-slate-700/50' : 'bg-white border-slate-200';
  const textClass = dark ? 'text-white' : 'text-slate-800';
  const subtitleClass = dark ? 'text-slate-300' : 'text-slate-500';
  const iconBgClass = dark ? 'bg-white/10 text-brand-accent' : 'bg-brand-accent/10 text-brand-accent';

  return (
    <div className={`flex items-center justify-between shrink-0 p-4 border-b shadow-sm z-10 ${bgClass} ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shadow-sm ${iconBgClass}`}>
          {icon}
        </div>
        <div>
          <h2 className={`text-lg font-extrabold ${textClass}`}>{title}</h2>
          <p className={`text-sm font-semibold ${subtitleClass}`}>{subtitle}</p>
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
