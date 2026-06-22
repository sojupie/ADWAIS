import type { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-4 w-full lg:min-h-full flex-1 pb-24 lg:pb-0">
            {children}
        </div>
    );
}