import type { ReactNode } from "react";

export function DashboardTopRow({ children }: { children: ReactNode }) {
    return (
        <>
            {/* Mobile: horizontal scrolling carousel */}
            <div className="kpi-carousel md:hidden flex flex-row overflow-x-auto gap-3 pb-1 shrink-0 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {children}
            </div>

            {/* Tablet/Desktop: responsive grid (unchanged) */}
            <section className="hidden md:grid grid-cols-2 portrait-lg:grid-cols-3 landscape-lg:grid-cols-5 gap-4 shrink-0">
                {children}
            </section>
        </>
    );
}