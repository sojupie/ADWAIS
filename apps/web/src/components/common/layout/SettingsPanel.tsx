import type { ReactNode } from 'react';

interface SettingsPanelProps {
  children: ReactNode;
  className?: string;
}

export function SettingsPanel({ children, className = '' }: SettingsPanelProps) {
  return (
    <section className={`flex flex-col h-full bg-slate-100 sm:bg-slate-100/80 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-inner max-h-[800px] xl:max-h-[calc(100vh-230px)] p-2 sm:p-2 gap-1 min-w-[285px] sm:min-w-[320px] min-w-0 ${className}`}>
      {children}
    </section>
  );
}
