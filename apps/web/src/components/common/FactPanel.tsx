import './FactPanel.css';

//use number for Pop and use string for descriptors next to value
type extra =
    | 
    { type: "PoP"; value: number; } 
    |
    { type: "Desc"; value: string; };

interface FactPanelData {
    label: string;
    value: string;
    valueColor?: "green" | "red"; 
    extra?: extra
}

export function FactPanel({ label, value, valueColor, extra }: FactPanelData) {
    let valueColorClass = '';
    let extraColor = '';
    let extraText = '';

    if (valueColor !== undefined) {
        valueColorClass = `text-${valueColor}`;
    }

    if (extra !== undefined && extra.type === "PoP") {
        if (extra.value > 0) {
            extraColor = 'text-green';
            extraText = `▲ ${extra.value.toFixed(2)}% PoP`;
        } else if (extra.value < 0) {
            extraColor = 'text-red';
            extraText = `▼ ${Math.abs(extra.value).toFixed(2)}% PoP`;
        } else {
            extraText = `${extra.value.toFixed(2)}% PoP`;
        }
    }

    if (extra !== undefined && extra.type === "Desc") {
        extraText = extra.value;
        extraColor = 'fact-panel__extra--desc';
    }

    return FactPanelJSX(
        label,
        value,
        valueColorClass,
        extraText,
        extraColor
    );
}

function FactPanelJSX(label: string, value: string, valueColor: string, extraText: string, extraColor: string) {
    return (
        <div className="fact-panel card">
            <div className="fact-panel__header">
                <span className="fact-panel__label">{label}</span>
            </div>

            <div className="fact-panel__body">
                <span className={`fact-panel__value ${valueColor}`}>
                    {value}
                </span>

                {extraText !== '' && (
                    <span className={`fact-panel__extra ${extraColor}`}>
                        {extraText}
                    </span>
                )}
            </div>
        </div>
    );
}
