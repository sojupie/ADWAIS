// import { LoadingIcon } from '../ui/LoadingIcon';

type Extra =
    | 
    { type: "PoP"; value: number; } 
    |
    { type: "Desc"; value: string; };

interface FactPanelProps {
    label: string;
    value: string;
    isLoading?: boolean;
    valueColor?: "green" | "red" | "yellow"; 
    extra?: Extra
}

export function FactPanel({ label, value, isLoading, valueColor, extra }: FactPanelProps) {
    let valueColorClass = 'text-slate-800';
    let extraColor = '';
    let extraText = '';

    if (valueColor === 'green') valueColorClass = 'text-growth';
    if (valueColor === 'red') valueColorClass = 'text-[#c92a2a]';
    if (valueColor === 'yellow') valueColorClass = 'text-decline-warning';

    if (extra !== undefined && extra.type === "PoP") {
        if (extra.value > 0) {
            extraColor = 'text-growth';
            extraText = `▲ ${extra.value.toFixed(2)}% PoP`;
        } else if (extra.value < 0) {
            extraColor = 'text-[#c92a2a]';
            extraText = `▼ ${Math.abs(extra.value).toFixed(2)}% PoP`;
        } else {
            extraText = `${extra.value.toFixed(2)}% PoP`;
        }
    }

    if (extra !== undefined && extra.type === "Desc") {
        extraText = extra.value;
        extraColor = 'text-slate-500';
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-between min-h-[90px] transition-all hover:shadow-md animate-in fade-in duration-300 min-w-0 overflow-hidden">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">{label}</h2>
            {isLoading ? (
                <div className="flex items-center gap-2 mt-1 animate-pulse">
                    <div className="h-8 w-24 bg-slate-200 rounded"></div>
                    <div className="h-5 w-16 bg-slate-100 rounded"></div>
                </div>
            ) : (
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mt-auto">
                    <span className={`text-2xl lg:text-3xl xl:text-2xl 2xl:text-4xl font-extrabold tracking-tight min-w-0 ${valueColorClass}`} style={{ wordBreak: 'break-word' }}>
                        {value}
                    </span>

                    {extraText !== '' && (
                        <span className={`text-sm 2xl:text-lg font-bold uppercase tracking-wider ${extraColor} whitespace-nowrap`}>
                            {extraText}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
