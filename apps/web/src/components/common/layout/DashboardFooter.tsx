import type { ReactNode } from 'react';

interface DashboardFooterProps {
  children: ReactNode;
}

export function DashboardFooter({ children }: DashboardFooterProps) {
  return (
    <footer className="desktop-only flex flex-col contained:flex-row justify-between items-center gap-2 w-full shrink-0">
      {children}
    </footer>
  );
}