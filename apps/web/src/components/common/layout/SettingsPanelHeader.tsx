import type { ReactNode } from 'react';

interface SettingsPanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function SettingsPanelHeader({
  title,
  subtitle,
  icon,
  children,
  className = '',
}: SettingsPanelHeaderProps) {
  return (
    <header className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-3 sm:px-5 sm:py-4 ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="m-0 text-base font-black uppercase tracking-widest text-on-surface-variant sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="m-0 mt-1 text-sm font-medium leading-5 text-on-surface-variant">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
