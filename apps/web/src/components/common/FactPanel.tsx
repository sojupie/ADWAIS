import { LoadingIcon } from './LoadingIcon';

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
    if (valueColor === 'red') valueColorClass = 'text-decline';
    if (valueColor === 'yellow') valueColorClass = 'text-decline-warning';

    if (extra !== undefined && extra.type === "PoP") {
        if (extra.value > 0) {
            extraColor = 'text-growth';
            extraText = `▲ ${extra.value.toFixed(2)}% PoP`;
        } else if (extra.value < 0) {
            extraColor = 'text-decline';
            extraText = `▼ ${Math.abs(extra.value).toFixed(2)}% PoP`;
        } else {
            extraText = `${extra.value.toFixed(2)}% PoP`;
        }
    }

    if (extra !== undefined && extra.type === "Desc") {
        extraText = extra.value;
        extraColor = 'text-slate-400';
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-center min-h-[90px] transition-all hover:shadow-md animate-in fade-in duration-300">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</h2>

            <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold tracking-tight ${valueColorClass}`}>
                    {isLoading ? <LoadingIcon /> : value}
                </span>

                {!isLoading && extraText !== '' && (
                    <span className={`text-[12px] font-bold uppercase tracking-wider ${extraColor} ml-1`}>
                        {extraText}
                    </span>
                )}
            </div>
        </div>
    );
}
