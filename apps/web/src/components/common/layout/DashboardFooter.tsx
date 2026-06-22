import type { ReactNode } from 'react';

interface DashboardFooterProps {
  children: ReactNode;
}

export function DashboardFooter({ children }: DashboardFooterProps) {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center gap-4 w-full shrink-0">
      {children}
    </footer>
  );
}