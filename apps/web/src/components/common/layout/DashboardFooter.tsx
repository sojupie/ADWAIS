import type { ReactNode } from 'react';

export function DashboardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-2 shrink-0 animate-in fade-in duration-500 z-20 relative">
      {children}
    </div>
  );
}