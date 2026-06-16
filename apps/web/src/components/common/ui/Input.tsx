import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', disabled, containerClassName = '', ...props }, ref) => {
    const widthClass = containerClassName.includes('w-') ? '' : 'w-full';
    return (
      <div className={`flex flex-col gap-1 ${widthClass} ${containerClassName}`}>
        {label && (
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full border px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-link/20 focus:border-brand-link/30 ${
              icon ? 'pl-9' : ''
            } ${
              disabled
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 hover:border-slate-400'
            } ${
              error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
