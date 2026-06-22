import { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X, Loader2, Lock } from 'lucide-react';

type InlineEditFieldProps<T> = {
  label: string;
  value: T;
  type?: 'text' | 'number' | 'password' | 'checkbox' | 'select';
  options?: { label: string; value: T }[];
  onSave: (val: T) => Promise<void> | void;
  required?: boolean;
  requiredCondition?: string;
  displayValue?: React.ReactNode;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
};

export function InlineEditField<T>({
  label,
  value,
  type = 'text',
  options = [],
  onSave,
  required = false,
  requiredCondition,
  displayValue,
  placeholder,
  allowClear = false,
  disabled = false,
}: InlineEditFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (isEditing && inputRef.current && type !== 'checkbox') {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    // If empty and not password
    if (type !== 'password' && required && (draft === '' || draft === null || draft === undefined)) {
      console.error(`${label} is required.`);
      return;
    }
    
    // For password, if it's empty, it means we don't want to save/change it
    if (type === 'password' && draft === '') {
      setIsEditing(false);
      return;
    }

    if (draft === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(draft);
      setIsEditing(false);
      // Reset draft for password to avoid keeping it in state
      if (type === 'password') setDraft('' as unknown as T);
    } catch (e) {
      console.error(e);
      console.error('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setDraft(value);
      setIsEditing(false);
    }
  };

  // Special handling for checkbox
  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-2 group relative py-1">
        <input
          type="checkbox"
          checked={(isEditing ? draft : value) as unknown as boolean}
          disabled={disabled || isSaving}
          onChange={(e) => {
            if (disabled) return;
            if (!isEditing) {
              // Direct save on toggle if not in edit mode
              setIsSaving(true);
              Promise.resolve(onSave(e.target.checked as unknown as T))
                .catch((err) => console.error(err))
                .finally(() => setIsSaving(false));
            } else {
              setDraft(e.target.checked as unknown as T);
            }
          }}
          className={`w-4 h-4 text-brand-link rounded border-slate-300 disabled:opacity-50 ${disabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer'}`}
        />
        <label className={`text-sm font-semibold select-none ${disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 cursor-pointer'}`}>
          {label}
        </label>
        {isSaving && <Loader2 size={12} className="animate-spin text-slate-400" />}
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col gap-1 py-1 px-2 -mx-2 rounded-lg transition-colors ${isEditing ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50 border border-transparent'}`}
    >
      <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>{label}</span>
        {required ? (
          <span className="text-red-500/70 lowercase font-medium text-sm">
            {requiredCondition ? `(Required ${requiredCondition})` : '(Required)'}
          </span>
        ) : (
          <span className="text-slate-400 lowercase font-medium text-sm">(Optional)</span>
        )}
      </label>

      {isEditing ? (
        <div className="flex items-center gap-2">
          {type === 'select' ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={draft as unknown as string}
              onChange={(e) => setDraft(e.target.value as unknown as T)}
              disabled={isSaving}
              onKeyDown={handleKeyDown}
              className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-brand-btn-primary focus:outline-none"
            >
              {options.map((opt) => (
                <option key={opt.value as React.Key} value={opt.value as unknown as string}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={(draft !== null && draft !== undefined) ? (draft as unknown as string) : ''}
              placeholder={placeholder || (type === 'password' ? '••••••••••••' : '')}
              onChange={(e) => {
                const val = e.target.value;
                setDraft((type === 'number' ? (val === '' ? null : Number(val)) : val) as unknown as T);
              }}
              disabled={isSaving}
              onKeyDown={handleKeyDown}
              className={`flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-brand-btn-primary focus:outline-none ${type === 'password' ? 'font-mono' : ''}`}
            />
          )}
          <div className="flex items-center gap-1">
            {allowClear && (type === 'password' ? value : draft) && (
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await onSave((type === 'number' ? null : '') as unknown as T);
                    setIsEditing(false);
                    if (type === 'password') setDraft('' as unknown as T);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="p-1 text-red-500 hover:bg-red-50 rounded text-sm font-bold"
                title="Clear"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-brand-link hover:bg-brand-btn-primary/10 rounded"
              title="Save"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
              onClick={() => {
                setDraft(value);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="p-1 text-slate-500 hover:bg-slate-100 rounded"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between group/val">
          <span className={`text-sm font-semibold text-slate-800 ${type === 'password' || displayValue === 'Not set' ? 'italic text-slate-400' : ''}`}>
            {displayValue ? displayValue : (
              type === 'password' ? (value ? '••••••••••••' : 'Not set') : (
                (value !== null && value !== undefined && value !== '') ? String(value) : '—'
              )
            )}
          </span>
          {disabled ? (
            <span className="p-1 text-slate-400 cursor-not-allowed opacity-60 flex items-center gap-1" title="Requires Admin privileges">
              <Lock size={12} />
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Admin</span>
            </span>
          ) : (
            <button
              onClick={() => {
                setDraft((type === 'password' ? '' : value) as unknown as T);
                setIsEditing(true);
              }}
              className="p-1 text-slate-400 hover:text-brand-link hover:bg-brand-bg-secondary rounded cursor-pointer transition-all opacity-100 sm:opacity-0 sm:group-hover/val:opacity-100"
              title="Edit"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
