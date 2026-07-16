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
    <div className={`bg-surface sm:border sm:border-outline-variant sm:rounded-2xl sm:shadow-sm border-b sm:border-b-0 border-outline-variant overflow-hidden flex flex-col break-inside-avoid ${className}`}>
      <SubSectionHeader title={title} subtitle={subtitle} icon={icon}>
        {headerActions}
      </SubSectionHeader>
      <div className="px-2 py-3 sm:p-4 flex flex-col gap-4 sm:gap-4">
        {children}
      </div>
    </div>
  );
}
