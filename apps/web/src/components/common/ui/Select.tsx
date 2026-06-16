import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon = <ChevronDown size={14} />, children, className = '', disabled, containerClassName = '', ...props }, ref) => {
    const widthClass = containerClassName.includes('w-') ? '' : 'w-full';
    const paddingClasses = className.includes('p-') || className.includes('px-') || className.includes('pl-') || className.includes('pr-') || className.includes('py-')
      ? ''
      : 'pl-4 pr-10 py-2.5';
    return (
      <div className={`flex flex-col gap-1 ${widthClass} ${containerClassName}`}>
        {label && (
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            disabled={disabled}
            className={`w-full border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-link/20 focus:border-brand-link/30 cursor-pointer appearance-none ${paddingClasses} ${
              disabled
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          {icon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
