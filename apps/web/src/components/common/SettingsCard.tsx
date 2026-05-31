import type { ReactNode } from 'react';
import { SubSectionHeader } from './SubSectionHeader';

interface SettingsCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  /** Optional actions rendered in the header's right slot */
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standardised card shell used by all settings sub-panels.
 * Composes SubSectionHeader + a padded content area inside a
 * white bordered card with consistent rounding/shadow.
 */
export function SettingsCard({
  title,
  subtitle,
  icon,
  headerActions,
  children,
  className = '',
}: SettingsCardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col break-inside-avoid animate-in fade-in ${className}`}>
      <SubSectionHeader title={title} subtitle={subtitle} icon={icon}>
        {headerActions}
      </SubSectionHeader>
      <div className="p-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
