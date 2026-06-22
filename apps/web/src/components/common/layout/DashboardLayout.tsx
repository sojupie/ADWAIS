import type { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6 w-full lg:h-full lg:min-h-0 flex-1 pb-24 lg:pb-0">
            {children}
        </div>
    );
}