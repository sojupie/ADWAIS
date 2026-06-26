import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  dropdownAlign?: 'left' | 'right';
  optionHeightClass?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon = <ChevronDown size={14} />, children, className = '', disabled, containerClassName = '', value, onChange, defaultValue, dropdownAlign = 'left', optionHeightClass, ...props }, ref) => {
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

    const widthClass = containerClassName.includes('w-') ? '' : 'w-full';

    const defaultPadding = className.includes('p-') || className.includes('px-') || className.includes('pl-') || className.includes('pr-') || className.includes('py-')
      ? ''
      : 'pl-3 pr-10 py-2 text-sm font-semibold';
    const defaultHeight = className.includes('h-') ? '' : 'h-10';
    const defaultBorder = className.includes('border-') ? '' : 'border border-slate-300 hover:border-slate-400';
    const defaultRounded = className.includes('rounded-') ? '' : 'rounded-xl';

    const tokens = className.split(/\s+/);
    const hasBgOverride = tokens.some(t => (t.startsWith('bg-') || t.startsWith('!bg-')) && !t.includes(':'));
    const isTextSize = (t: string) => /^!?text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/.test(t);
    const hasTextOverride = tokens.some(t => (t.startsWith('text-') || t.startsWith('!text-')) && !t.includes(':') && !isTextSize(t));

    const defaultBg = hasBgOverride ? '' : 'bg-slate-50';
    const defaultText = hasTextOverride ? '' : 'text-slate-800';

    const alignClass = dropdownAlign === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';

    return (
      <div ref={containerRef} className={`flex flex-col relative ${widthClass} ${containerClassName}`}>
        {label && (
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
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
            className={`w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-link/20 focus:border-brand-link/30 cursor-pointer flex items-center justify-between ${defaultPadding} ${defaultHeight} ${defaultBorder} ${defaultRounded} ${disabled
              ? 'bg-slate-100 border-slate-200 text-slate-450 cursor-not-allowed'
              : `${defaultBg} ${defaultText}`
              } ${className}`}
          >
            <span className="truncate flex items-center h-full leading-none">
              {activeOption ? activeOption.label : 'Select...'}
            </span>
          </button>

          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          {isOpen && !disabled && (
            <div className={`absolute top-full mt-1.5 ${alignClass} min-w-[160px] bg-white border border-slate-200/80 shadow-xl rounded-xl p-1 flex flex-col gap-0.5 z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-100`}>
              {options.map((opt) => {
                const isSelected = opt.value === activeValue;
                const itemHeight = optionHeightClass || 'h-9';
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full text-left px-3 ${itemHeight} flex items-center text-sm font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none ${isSelected
                      ? 'bg-brand-accent/15 text-slate-800 font-bold hover:bg-brand-accent/20'
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
