import type { ReactNode } from "react";
import {useMediaQuery} from "../../../hooks/useMediaQuery";

export function DashboardTopRow({ children }: { children: ReactNode }) {
    const isMobileView = useMediaQuery('(max-width: 767px)');

    if (isMobileView) {
        return (
            <div className="[mask-image:linear-gradient(to_right,black_90%,transparent_100%)]">
                <div className="kpi-carousel flex flex-row overflow-x-auto snap-x snap-mandatory gap-2 shrink-0 -mx-1 px-1 pb-3">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <section className="grid grid-cols-2 portrait-lg:grid-cols-3 landscape-lg:grid-cols-5 gap-4 shrink-0">
            {children}
        </section>
    );
}
