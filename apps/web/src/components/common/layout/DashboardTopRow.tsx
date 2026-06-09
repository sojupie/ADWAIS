import type {ReactNode} from "react";

export function DashboardTopRow({children}: { children: ReactNode }) {
    return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 shrink-0">
        {children}
    </section>
    );
}