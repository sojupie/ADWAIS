import type {PersistentDomain} from "../../../utils/timeframeStorage.ts";
import {useState} from "react";
import {PeriodSelector} from "../charts/PeriodSelector.tsx";
import {SyncStatusWidget} from "../dashboard/SyncStatusWidget.tsx";
import {SlidersHorizontal} from "lucide-react";

/** Single floating action pill - mobile equivalent of the desktop DashboardFooter.
 *  Expands upward to show PeriodSelector + SyncStatusWidget. Closes on backdrop click.
 */
export function MobileFooterPill({domain}: { domain: PersistentDomain }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="relative z-40 flex flex-col items-end gap-6">
                {isOpen && (
                    <div
                        className="flex flex-col gap-0 bg-brand-bg-secondary rounded-2xl overflow-hidden m3-elevation-3 w-[min(90vw,360px)]">
                        <div className="flex flex-col gap-4 px-4 pt-4 pb-3">
                            <span
                                className="text-xs font-black text-white/70 uppercase tracking-widest">Timeframe</span>
                            <PeriodSelector from={domain} embedded={true}/>
                        </div>
                        <div className="h-px bg-surface/10 mx-4"/>
                        <div className="flex flex-col gap-4 px-4 pt-3 pb-4">
                            <span
                                className="text-xs font-black text-white/70 uppercase tracking-widest">Sync Status</span>
                            <SyncStatusWidget embedded={true}/>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(v => !v)}
                    className={`w-16 h-16 flex items-center justify-center rounded-3xl transition-all duration-200 cursor-pointer m3-elevation-2 hover:m3-elevation-3 bg-brand-accent text-brand-bg-secondary }`}
                    aria-label="Toggle timeframe and sync panel"
                    aria-expanded={isOpen}
                >
                    <SlidersHorizontal size={28} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            </div>
        </>
    );
}
