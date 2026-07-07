import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  dropdownAlign?: string;
  optionClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    icon = <ChevronDown size={14} />, 
    children, 
    className = 'pl-3 pr-10 py-2 text-sm font-semibold h-10 border border-slate-300 hover:border-slate-400 rounded-xl bg-slate-50 text-slate-800', 
    disabled, 
    containerClassName = 'flex flex-col relative w-full', 
    value, 
    onChange, 
    defaultValue, 
    dropdownAlign = 'left', 
    optionClassName = 'py-1.5 min-h-[36px]', 
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(() => {
      if (defaultValue !== undefined) return String(defaultValue);
      return '';
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    React.useImperativeHandle(ref, () => selectRef.current!);

    const options: { value: string; label: string; disabled?: boolean }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const optionProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
        options.push({
          value: String(optionProps.value ?? ''),
          label: String(optionProps.children ?? ''),
          disabled: optionProps.disabled,
        });
      }
    });

    const isControlled = value !== undefined;
    const activeValue = isControlled ? String(value) : uncontrolledValue;
    const activeOption = options.find((opt) => opt.value === activeValue) || options[0];

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleSelectOption = (optValue: string) => {
      if (disabled) return;

      if (!isControlled) {
        setUncontrolledValue(optValue);
      }
      setIsOpen(false);

      if (selectRef.current) {
        selectRef.current.value = optValue;
      }

      if (onChange) {
        const event = {
          target: {
            value: optValue,
            name: props.name,
          },
          currentTarget: {
            value: optValue,
            name: props.name,
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
    };

    const alignClass = 
      dropdownAlign === 'right' ? 'right-0 origin-top-right' : 
      dropdownAlign === 'left' ? 'left-0 origin-top-left' : 
      dropdownAlign;

    return (
      <div ref={containerRef} className={containerClassName}>
        {label && (
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label}
          </label>
        )}

        {/* Hidden select to preserve form element lifecycle/refs */}
        <select
          ref={selectRef}
          value={activeValue}
          onChange={(e) => handleSelectOption(e.target.value)}
          disabled={disabled}
          className="sr-only"
          {...props}
        >
          {children}
        </select>

        <div className="relative w-full flex items-center">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-link/20 focus:border-brand-link/30 cursor-pointer flex items-center justify-between ${className} ${
              disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <span className="truncate block pr-4 leading-none">
              {activeOption ? activeOption.label : 'Select...'}
            </span>
          </button>

          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          {isOpen && !disabled && (
            <div className={`absolute top-full mt-1.5 ${alignClass} min-w-full w-max max-w-[340px] bg-white border border-slate-200/80 shadow-xl rounded-xl p-1 flex flex-col gap-0.5 z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-100`}>
              {options.map((opt) => {
                const isSelected = opt.value === activeValue;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`${optionClassName} w-full text-left px-3 flex items-center text-sm font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none leading-tight shrink-0 ${isSelected
                      ? 'bg-brand-btn-primary/10 text-slate-800 font-bold hover:bg-brand-accent/20'
                      : opt.disabled
                        ? 'text-slate-350 bg-slate-50/50 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
