import React from 'react';
import { Lock, Loader2 } from 'lucide-react';

interface SecureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  locked?: boolean;
  lockTitle?: string;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function SecureButton({
  locked = false,
  lockTitle = 'Requires higher privileges',
  loading = false,
  loadingText,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: SecureButtonProps) {
  const isButtonDisabled = disabled || loading || locked;

  // Strip conflicting color, state, and pointer classes if locked to ensure a clean, high-contrast style
  const combinedClassName = locked
    ? className
        .replace(/(bg|text|border|hover|active|shadow|cursor|opacity)-\S+/g, '')
        .replace(/(hover|active|focus|disabled):\S+/g, '')
        .trim() + ' bg-slate-500/10 border border-slate-500/20 text-on-surface-variant font-bold cursor-not-allowed shadow-none opacity-80 flex items-center justify-center gap-2'
    : className;

  return (
    <button
      {...props}
      disabled={isButtonDisabled}
      title={locked ? lockTitle : props.title}
      className={combinedClassName}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin shrink-0" size={16} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {locked ? <Lock className="shrink-0" size={16} /> : icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
