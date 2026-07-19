import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface MultiSelectFilterProps {
  label: ReactNode;
  icon?: ReactNode;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

interface MenuPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  opensAbove: boolean;
}

const VIEWPORT_MARGIN = 8;
const MENU_GAP = 6;
const MIN_MENU_WIDTH = 220;
const MAX_MENU_HEIGHT = 320;

export function MultiSelectFilter({
  label,
  icon,
  options,
  value,
  onChange,
  disabled,
}: MultiSelectFilterProps) {
  const generatedId = useId();
  const selectId = `multiselect-${generatedId}`;
  const listboxId = `${selectId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(
      Math.max(rect.width, MIN_MENU_WIDTH),
      viewportWidth - VIEWPORT_MARGIN * 2,
    );
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, viewportWidth - width - VIEWPORT_MARGIN),
    );
    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN - MENU_GAP;
    const spaceAbove = rect.top - VIEWPORT_MARGIN - MENU_GAP;
    const opensAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
    const availableHeight = opensAbove ? spaceAbove : spaceBelow;

    setMenuPosition({
      left,
      top: opensAbove ? rect.top - MENU_GAP : rect.bottom + MENU_GAP,
      width,
      maxHeight: Math.max(120, Math.min(MAX_MENU_HEIGHT, availableHeight)),
      opensAbove,
    });
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    updateMenuPosition();
    setIsOpen(true);
  }, [disabled, updateMenuPosition]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [closeMenu, isOpen, updateMenuPosition]);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const hasSelection = value.length > 0;

  return (
    <div className="inline-flex flex-col gap-1.5 relative">
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        data-md3-ripple
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => isOpen ? closeMenu() : openMenu()}
        className={`min-h-8 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold border outline-none transition-all rounded-full disabled:cursor-not-allowed disabled:opacity-50 select-none
          ${hasSelection 
            ? 'bg-secondary text-on-secondary border-transparent m3-elevation-1 hover:m3-elevation-2' 
            : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-low hover:border-outline'
          }`}
      >
        {icon && (
          <span className="shrink-0 flex items-center justify-center opacity-80">
            {icon}
          </span>
        )}
        <span className="truncate max-w-[120px]">
          {label} {hasSelection ? `(${value.length})` : ''}
        </span>
        {hasSelection ? (
          <div 
            role="button" 
            tabIndex={0}
            className="flex items-center justify-center ml-1 opacity-80 hover:opacity-100 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            onClick={handleClear}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as any); }}
          >
            <X size={14} strokeWidth={3} />
          </div>
        ) : (
          <ChevronDown size={14} strokeWidth={3} className="opacity-60" />
        )}
      </button>

      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="fixed z-[200] flex flex-col gap-1 overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-2 m3-elevation-4 custom-scrollbar"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            transform: menuPosition.opensAbove ? 'translateY(-100%)' : undefined,
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-on-surface-variant italic">
              No options available
            </div>
          ) : (
            <>
              {hasSelection && (
                <button
                  type="button"
                  data-md3-ripple
                  onClick={(e) => handleClear(e as any)}
                  className="flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-sm font-bold text-error outline-none transition-colors hover:bg-error-container hover:text-on-error-container"
                >
                  <X size={16} strokeWidth={2.5} />
                  Clear Selection
                </button>
              )}
              {options.map((option, index) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    role="option"
                    data-md3-ripple
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => toggleOption(option.value)}
                    className={`flex min-h-11 shrink-0 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40 
                      ${isSelected
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'text-on-surface hover:bg-surface-container-low'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-secondary border-secondary text-on-secondary' : 'border-outline-variant bg-surface'}`}
                      >
                        {isSelected && <Check size={12} strokeWidth={4} />}
                      </div>
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
