import type { ReactNode } from 'react';
import './ChartPanel.css';

interface ChartPanelData {
  title: string;
  legend?: ReactNode;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}

export function ChartPanel({ title, legend, bodyClassName = '', className = '', children }: ChartPanelData) {
  return (
      <div className={`chart-panel card ${className}`}>
        <div className="chart-panel__header">
            <span className="chart-panel__title">
                {title}
            </span>
            {legend}
      </div>
        <div className={`chart-panel__body ${bodyClassName}`}>
            {children}
        </div>
      </div>
  );
}
