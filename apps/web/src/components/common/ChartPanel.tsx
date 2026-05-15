import type { ReactNode } from 'react';
import './ChartPanel.css';

interface ChartPanelProps {
  title: string;
  legend?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
}

export function ChartPanel({ title, legend, bodyClassName = '', children }: ChartPanelProps) {
  return (
    <div className="chart-panel card">
      <div className="chart-panel__header">
        <span className="chart-panel__title">{title}</span>
        {legend}
      </div>

      <div className={`chart-panel__body ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
