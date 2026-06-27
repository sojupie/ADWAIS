import type { ReactNode } from "react";

export function DashboardTopRow({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="md:hidden [mask-image:linear-gradient(to_right,black_90%,transparent_100%)]">
                <div className="kpi-carousel flex flex-row overflow-x-auto snap-x snap-mandatory gap-2 shrink-0 -mx-1 px-1 pb-3">
                    {children}
                </div>
            </div>

            <section className="hidden md:grid grid-cols-2 portrait-lg:grid-cols-3 landscape-lg:grid-cols-5 gap-4 shrink-0">
                {children}
            </section>
        </>
    );
}