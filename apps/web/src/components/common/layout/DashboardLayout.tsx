import type { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 w-full contained:min-h-full contained:flex-1 pb-3 contained:min-h-0 bg-surface-container-low">
            {children}
        </div>
    );
}