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

            <div className="relative z-40 flex flex-col items-end gap-3">
                {isOpen && (
                    <div
                        className="flex flex-col gap-0 bg-brand-bg-secondary/75 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] w-[min(90vw,360px)]">
                        <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
                            <span
                                className="text-xs font-black text-white/70 uppercase tracking-widest">Timeframe</span>
                            <PeriodSelector from={domain}/>
                        </div>
                        <div className="h-px bg-white/10 mx-4"/>
                        <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                            <span
                                className="text-xs font-black text-white/70 uppercase tracking-widest">Sync Status</span>
                            <SyncStatusWidget/>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl border transition-colors ${isOpen
                        ? 'bg-brand-accent text-brand-bg-secondary border-brand-accent/40'
                        : 'bg-brand-bg-secondary text-white border-white/15 hover:bg-brand-bg-quaternary'
                    }`}
                    aria-label="Toggle timeframe and sync panel"
                    aria-expanded={isOpen}
                >
                    <SlidersHorizontal size={15}/>
                    <span>Actions</span>
                </button>
            </div>
        </>
    );
}
