import type { ReactNode } from 'react';
import './CollectionPanel.css';

interface CollectionPanelProps {
  title: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function CollectionPanel({ title, actions, className = '', children }: CollectionPanelProps) {
  return (
      <div className={`collection-panel card ${className}`}>
          <div className="collection-panel__header">
            <span className="collection-panel__title">
                {title}
            </span>
            {actions}
          </div>
          <div className="collection-panel__body">
                {children}
          </div>
      </div>
  );
}
