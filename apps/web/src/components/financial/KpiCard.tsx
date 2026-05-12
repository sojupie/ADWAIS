import './KpiCard.css';

interface KpiCardProps {
  label: string;
  sublabel?: string;
  value: string;
  pop?: number;      // period-over-period %, e.g. 6.37
  footer?: string;
}

export function KpiCard({ label, sublabel, value, pop, footer }: KpiCardProps) {
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
    <div className="kpi-card card">
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        {sublabel && <span className="kpi-card__sublabel">{sublabel}</span>}
      </div>

      <div className="kpi-card__body">
        <span className="kpi-card__value">{value}</span>
        {popLabel && (
          <span className={`badge ${badgeClass}`}>
            {popLabel}
          </span>
        )}
      </div>

      {footer && (
        <div className="kpi-card__footer text-muted">{footer}</div>
      )}
    </div>
  );
}
