import { LoadingIcon } from './LoadingIcon';

type extra =
    | 
    { type: "PoP"; value: number; } 
    |
    { type: "Desc"; value: string; };

interface FactPanelData {
    label: string;
    value: string;
    isLoading?: boolean;
    valueColor?: "green" | "red" | "yellow"; 
    extra?: extra
}

export function FactPanel({ label, value, isLoading, valueColor, extra }: FactPanelData) {
    let valueColorClass = 'text-[#1e293b]';
    let extraColor = '';
    let extraText = '';

    if (valueColor === 'green') valueColorClass = 'text-[#37b24d]';
    if (valueColor === 'red') valueColorClass = 'text-[#f03e3e]';
    if (valueColor === 'yellow') valueColorClass = 'text-[#f59f00]';

    if (extra !== undefined && extra.type === "PoP") {
        if (extra.value > 0) {
            extraColor = 'text-[#37b24d]';
            extraText = `▲ ${extra.value.toFixed(2)}% PoP`;
        } else if (extra.value < 0) {
            extraColor = 'text-[#f03e3e]';
            extraText = `▼ ${Math.abs(extra.value).toFixed(2)}% PoP`;
        } else {
            extraText = `${extra.value.toFixed(2)}% PoP`;
        }
    }

    if (extra !== undefined && extra.type === "Desc") {
        extraText = extra.value;
        extraColor = 'text-[#94a3b8]';
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
