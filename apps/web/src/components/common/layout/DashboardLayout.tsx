import type {ReactNode} from "react";

export function DashboardLayout({children}: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6 w-full h-full min-h-0 flex-1">
            {children}
        </div>
    );
}