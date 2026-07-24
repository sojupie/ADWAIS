import type { ReactNode } from 'react';

interface SettingsPanelProps {
  children: ReactNode;
  className?: string;
}

export function SettingsPanel({ children, className = '' }: SettingsPanelProps) {
  return (
    <section className={`flex contained:max-h-none max-h-[500px] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-outline bg-surface ${className}`}>
      {children}
    </section>
  );
}
