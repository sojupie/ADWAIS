import './FactPanel.css';

interface FactPanelProps {
  label: string;
  sublabel?: string;
  value: string;
  pop?: number;      // period-over-period %, e.g. 6.37
}

export function FactPanel({ label, sublabel, value, pop }: FactPanelProps) {
  const badgeClass = pop === undefined
    ? ''
    : pop === 0
      ? 'badge-neutral'
      : pop > 0
        ? 'badge-green'
        : 'badge-red';
  const popLabel = pop !== undefined
    ? `${pop >= 0 ? '▲' : '▼'} ${Math.abs(pop).toFixed(2)}% PoP`
    : null;

  return (
    <div className="fact-panel card">
      <div className="fact-panel__header">
        <span className="fact-panel__label">{label}</span>
        {sublabel && <span className="fact-panel__sublabel">{sublabel}</span>}
      </div>

      <div className="fact-panel__body">
        <span className="fact-panel__value">{value}</span>
        {popLabel && (
          <span className={`badge ${badgeClass}`}>
            {popLabel}
          </span>
        )}
      </div>

    </div>
  );
}
