import type { ReactNode } from 'react';
import { Skeleton } from '../ui/Skeleton';

type Extra =
    | 
    { type: "PoP"; value: number; } 
    |
    { type: "Desc"; value: string; };

interface FactPanelProps {
    label: string;
    value?: string;
    isLoading?: boolean;
    valueColor?: "green" | "red" | "yellow"; 
    extra?: Extra;
    hasExtra?: boolean;
    inverseTrend?: boolean;
    children?: ReactNode;
}

export function FactPanel({ label, value = '', isLoading, valueColor, extra, hasExtra, inverseTrend, children }: FactPanelProps) {
    let valueColorClass = 'text-slate-800';
    let extraColor = '';
    let extraText = '';

    if (valueColor === 'green') valueColorClass = 'text-growth';
    if (valueColor === 'red') valueColorClass = 'text-decline';
    if (valueColor === 'yellow') valueColorClass = 'text-decline-warning';

    if (extra !== undefined && extra.type === "PoP") {
        if (extra.value > 0) {
            extraColor = inverseTrend ? 'text-decline' : 'text-growth';
            extraText = `▲ ${extra.value.toFixed(2)}% PoP`;
        } else if (extra.value < 0) {
            extraColor = inverseTrend ? 'text-growth' : 'text-decline';
            extraText = `▼ ${Math.abs(extra.value).toFixed(2)}% PoP`;
        } else {
            extraColor = 'text-slate-500';
            extraText = `${extra.value.toFixed(2)}% PoP`;
        }
    }

    if (extra !== undefined && extra.type === "Desc") {
        extraText = extra.value;
        extraColor = 'text-slate-500';
    }

    const showExtra = hasExtra || extra !== undefined;

    return (
        <div className="snap-start bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2 md:px-4 md:py-3 flex flex-col justify-between min-h-[72px] md:min-h-[90px] min-w-[40vw] md:min-w-0 md:w-full transition-all hover:shadow-md overflow-hidden shrink-0">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">{label}</h2>
            {isLoading ? (
                <div className="flex flex-col mt-auto">
                    <Skeleton className="h-8 lg:h-9 xl:h-8 2xl:h-10 w-28 bg-slate-200" />
                    {showExtra && <Skeleton className="h-5 2xl:h-6 w-20 bg-slate-100" />}
                </div>
            ) : children ? (
                <div className="flex flex-col mt-auto">
                    {children}
                </div>
            ) : (
                <div className="flex flex-col mt-auto">
                <span className={`text-xl md:text-2xl lg:text-3xl 2xl:text-4xl font-extrabold tracking-tight min-w-0 ${valueColorClass}`} style={{ wordBreak: 'break-word' }}>
                    {value}
                </span>

                    {extraText !== '' && (
                        <span className={`text-sm 2xl:text-base font-bold tracking-wider ${extraColor} whitespace-nowrap`}>
                        {extraText}
                    </span>
                    )}
                </div>
            )}
        </div>
    );
}
