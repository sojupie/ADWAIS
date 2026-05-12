import './LoadingIcon.css';

interface LoadingIconProps {
  label?: string;
}

export function LoadingIcon({ label = 'Loading' }: LoadingIconProps) {
  return (
    <div className="loading-icon" role="status" aria-live="polite" aria-label={label}>
      <span className="loading-icon__spinner" />
    </div>
  );
}
