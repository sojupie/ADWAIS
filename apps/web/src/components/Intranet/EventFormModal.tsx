import { Calendar, Edit, X } from 'lucide-react';
import { EventType, RecurrenceType } from '@types';

export type EventForm = {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  eventType: EventType;
  isImportant: boolean;
  isRecurring: boolean;
  isSpecial: boolean;
  recurrence: RecurrenceType;
};

interface EventFormModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  form: EventForm;
  onChange: (form: EventForm) => void;
}

const inputClass = 'w-full rounded-xl border-0 bg-surface-container px-4 py-3 text-base font-medium text-on-surface transition-all focus:bg-primary-container focus:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-secondary/40';
const fieldClass = 'flex flex-col gap-2';
const labelClass = 'pl-1 text-sm font-bold text-on-surface-variant';

export function EventFormModal({ mode, isOpen, onClose, onSubmit, form, onChange }: EventFormModalProps) {
  if (!isOpen) return null;

  const isEditing = mode === 'edit';
  const Icon = isEditing ? Edit : Calendar;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in"
      role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <form
        onSubmit={onSubmit}
        className="m3-elevation-4 flex w-full max-w-md flex-col overflow-hidden rounded-3xl border-0 bg-surface animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${mode}-event-dialog-title`}
      >
        <div className="flex items-center justify-between bg-surface px-6 py-5">
          <h3 id={`${mode}-event-dialog-title`} className="flex items-center gap-4 text-xl font-bold text-on-surface">
            <Icon size={20} className="text-on-surface-variant" aria-hidden="true" />
            {isEditing ? 'Edit Calendar Event' : 'Add Calendar Event'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close event dialog" className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex max-h-[75vh] flex-col gap-6 overflow-y-auto bg-surface px-6 pb-6 custom-scrollbar">
          <div className={fieldClass}>
            <label className={labelClass} htmlFor={`${mode}-event-title`}>Event Title</label>
            <input id={`${mode}-event-title`} type="text" placeholder="Weekly Sync / Launch / etc." value={form.title} onChange={event => onChange({ ...form, title: event.target.value })} className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <label className={labelClass} htmlFor={`${mode}-event-start`}>Start Time</label>
              <input id={`${mode}-event-start`} type="datetime-local" value={form.startTime} onChange={event => onChange({ ...form, startTime: event.target.value })} className={`${inputClass} cursor-pointer`} required />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor={`${mode}-event-end`}>End Time</label>
              <input id={`${mode}-event-end`} type="datetime-local" value={form.endTime} onChange={event => onChange({ ...form, endTime: event.target.value })} className={`${inputClass} cursor-pointer`} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <label className={labelClass} htmlFor={`${mode}-event-category`}>Event Category</label>
              <select id={`${mode}-event-category`} value={form.eventType} onChange={event => onChange({ ...form, eventType: event.target.value as EventType })} className={`${inputClass} cursor-pointer`}>
                {Object.keys(EventType).map(key => <option key={key} value={key as EventType}>{key}</option>)}
              </select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor={`${mode}-event-location`}>Location</label>
              <input id={`${mode}-event-location`} type="text" placeholder="Kitchen / Zoom / Slack" value={form.location} onChange={event => onChange({ ...form, location: event.target.value })} className={inputClass} />
            </div>
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor={`${mode}-event-description`}>Description</label>
            <textarea id={`${mode}-event-description`} rows={3} placeholder="Event scope, notes, etc." value={form.description} onChange={event => onChange({ ...form, description: event.target.value })} className={`${inputClass} resize-none custom-scrollbar`} />
          </div>

          <div className="flex flex-wrap gap-8 rounded-2xl bg-surface-container-low p-4">
            <label className="flex cursor-pointer items-center gap-4 text-base font-medium text-on-surface-variant">
              <input type="checkbox" checked={form.isImportant} onChange={event => onChange({ ...form, isImportant: event.target.checked })} className="h-4 w-4 cursor-pointer rounded text-brand-accent focus:ring-brand-accent/20" />
              Important Highlight
            </label>
            <label className="flex cursor-pointer items-center gap-4 text-base font-medium text-on-surface-variant">
              <input type="checkbox" checked={form.isSpecial} onChange={event => onChange({ ...form, isSpecial: event.target.checked })} className="h-4 w-4 cursor-pointer rounded text-brand-accent focus:ring-brand-accent/20" />
              Special Occasion
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 bg-surface px-6 py-4">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-base font-bold transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary">Cancel</button>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary">
            {isEditing ? 'Save Changes' : 'Save Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
