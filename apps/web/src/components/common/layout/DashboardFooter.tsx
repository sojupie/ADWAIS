import { type ReactNode } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

interface DashboardFooterProps {
  children: ReactNode;
}

export function DashboardFooter({ children }: DashboardFooterProps) {
  const isMobileView = useMediaQuery('(max-width: 767px)');

  if (isMobileView) return null;

  return (
    <footer className="flex flex-col contained:flex-row justify-between items-center gap-2 w-full shrink-0">
      {children}
    </footer>
  );
}
