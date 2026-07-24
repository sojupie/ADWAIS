import { useState, type InputHTMLAttributes, type Key, type ReactNode } from 'react';
import { Check, Edit3, Loader2, Lock, X } from 'lucide-react';
import { CheckboxField, FormField } from './FormField';

type InlineEditKind = 'text' | 'number' | 'password' | 'select' | 'checkbox';

export interface InlineEditFieldProps<T> {
  label: string;
  value: T;
  onCommit: (value: T) => Promise<void> | void;
  kind?: InlineEditKind;
  options?: ReadonlyArray<{ label: string; value: T }>;
  renderValue?: ReactNode;
  placeholder?: string;
  required?: boolean;
  requirement?: string;
  helperText?: ReactNode;
  validate?: (value: T) => string | undefined;
  canClear?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'>;
}

function isEmpty(value: unknown) {
  return value === '' || value === null || value === undefined;
}

export function InlineEditField<T>({
  label,
  value,
  onCommit,
  kind = 'text',
  options = [],
  renderValue,
  placeholder,
  required = false,
  requirement,
  helperText,
  validate,
  canClear = false,
  disabled = false,
  hideLabel = false,
  inputProps,
}: InlineEditFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const stopEditing = () => {
    setDraft(value);
    setError(undefined);
    setIsEditing(false);
  };

  const commit = async (nextValue = draft) => {
    const validationError = required && isEmpty(nextValue)
      ? `${label} is required.`
      : validate?.(nextValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (kind === 'password' && nextValue === '') {
      stopEditing();
      return;
    }
    if (Object.is(nextValue, value)) {
      stopEditing();
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      await onCommit(nextValue);
      setIsEditing(false);
      if (kind === 'password') setDraft('' as T);
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Unable to save this value.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    if (disabled) return;
    setDraft((kind === 'password' ? '' : value) as T);
    setError(undefined);
    setIsEditing(true);
  };

  if (kind === 'select' && options.length === 0) {
    throw new Error(`InlineEditField "${label}" requires options when kind="select".`);
  }

  const meta = required
    ? requirement
      ? `Required · ${requirement}`
      : 'Required'
    : 'Optional';

  if (kind === 'checkbox') {
    return (
      <CheckboxField
        label={label}
        checked={Boolean(value)}
        disabled={disabled || isSaving}
        error={error}
        helperText={helperText}
        onChange={event => {
          setIsSaving(true);
          setError(undefined);
          Promise.resolve(onCommit(event.target.checked as T))
            .catch(commitError => {
              setError(commitError instanceof Error ? commitError.message : 'Unable to save this value.');
            })
            .finally(() => setIsSaving(false));
        }}
      />
    );
  }

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${hideLabel ? '' : 'w-full'}`}>
      {!hideLabel && (
        <div className="flex min-h-5 items-start justify-between gap-3 px-1">
          <span className="text-sm font-bold text-on-surface-variant">{label}</span>
          <span className={`text-xs font-medium ${error ? 'text-error' : 'text-on-surface-variant'}`}>
            {error || meta}
          </span>
        </div>
      )}

      {isEditing ? (
        <form
          className="flex min-w-0 flex-wrap items-start gap-2"
          onSubmit={event => {
            event.preventDefault();
            void commit();
          }}
        >
          {kind === 'select' ? (
            <FormField
              as="select"
              label={label}
              hideLabel
              autoFocus
              value={draft as string}
              disabled={isSaving}
              error={hideLabel ? error : undefined}
              density="default"
              containerClassName="min-w-[160px] flex-1"
              onChange={event => setDraft(event.target.value as T)}
              onKeyDown={event => {
                if (event.key === 'Escape') stopEditing();
              }}
            >
              {options.map(option => (
                <option key={option.value as Key} value={option.value as string}>
                  {option.label}
                </option>
              ))}
            </FormField>
          ) : (
            <FormField
              {...inputProps}
              label={label}
              hideLabel
              autoFocus
              type={kind}
              value={isEmpty(draft) ? '' : String(draft)}
              placeholder={placeholder || (kind === 'password' ? '••••••••••••' : undefined)}
              disabled={isSaving}
              error={hideLabel ? error : undefined}
              density="default"
              containerClassName="min-w-[160px] flex-1"
              onChange={event => {
                const rawValue = event.target.value;
                setDraft((kind === 'number'
                  ? rawValue === '' ? null : Number(rawValue)
                  : rawValue) as T);
              }}
              onKeyDown={event => {
                inputProps?.onKeyDown?.(event);
                if (event.key === 'Escape') stopEditing();
              }}
            />
          )}
          <div className="flex shrink-0 items-center gap-1 pt-0">
            {canClear && !isEmpty(kind === 'password' ? value : draft) && (
              <button
                type="button"
                onClick={() => void commit((kind === 'number' ? null : '') as T)}
                disabled={isSaving}
                className="min-h-10 rounded-full px-3 text-sm font-bold text-error transition-colors hover:bg-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38]"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              aria-label={`Save ${label}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition-colors hover:bg-secondary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38]"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            </button>
            <button
              type="button"
              onClick={stopEditing}
              disabled={isSaving}
              aria-label={`Cancel editing ${label}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38]"
            >
              <X size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div
          role={disabled ? undefined : 'button'}
          tabIndex={disabled ? undefined : 0}
          aria-label={disabled ? undefined : `Edit ${label}`}
          onClick={startEditing}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              startEditing();
            }
          }}
          className={`flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors ${
            disabled
              ? 'cursor-not-allowed bg-on-surface/[0.1] text-on-surface/[0.38]'
              : 'cursor-pointer border border-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary'
          }`}
        >
          <div className={`min-w-0 text-base font-medium ${disabled ? 'text-on-surface/[0.38]' : 'text-on-surface'}`}>
            {renderValue ?? (
              kind === 'password'
                ? value ? '••••••••••••' : 'Not set'
                : isEmpty(value) ? '—' : String(value)
            )}
          </div>
          <span className="flex shrink-0 items-center gap-2">
            {disabled ? <Lock size={16} /> : <Edit3 size={18} />}
          </span>
        </div>
      )}

      {!hideLabel && helperText && !error && (
        <span className="px-1 text-xs font-medium text-on-surface-variant">{helperText}</span>
      )}
    </div>
  );
}
