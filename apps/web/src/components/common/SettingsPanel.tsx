import type { ReactNode } from 'react';

interface SettingsPanelProps {
  children: ReactNode;
  className?: string;
}

export function SettingsPanel({ children, className = '' }: SettingsPanelProps) {
  return (
    <section className={`flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </section>
  );
}
