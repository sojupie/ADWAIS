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
    <div className={`flex items-center justify-between px-3 py-2 sm:p-4 border-b border-outline-variant bg-surface-container-lowest ${className}`}>
      <div className="flex items-center gap-6">
        <div className="p-2 bg-brand-link/10 text-brand-link rounded-lg shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="text-md font-bold text-brand-text leading-tight">{title}</h3>
          <p className="text-sm font-semibold text-on-surface-variant mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-4">
          {children}
        </div>
      )}
    </div>
  );
}
