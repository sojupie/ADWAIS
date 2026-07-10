import { X, Calendar } from 'lucide-react';
import { EventType } from '@types';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    eventType: string;
    isImportant: boolean;
    isRecurring: boolean;
    isSpecial: boolean;
    recurrence: string;
  };
  onChange: (form: any) => void;
}

export function EventCreateModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onChange
}: EventCreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <form onSubmit={onSubmit} className="bg-surface rounded-3xl shadow-2xl border-0 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
        <div className="flex justify-between items-center bg-surface px-6 py-5 pb-2">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Calendar size={20} className="text-on-surface-variant" /> Add Calendar Event
          </h3>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface-variant cursor-pointer p-1 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 pt-2 flex flex-col gap-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface-variant pl-1">Event Title</label>
            <input type="text" placeholder="Weekly Sync / Launch / etc." value={form.title} onChange={e => onChange({ ...form, title: e.target.value })} className="w-full bg-surface-container border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 transition-all text-on-surface" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant pl-1">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={e => onChange({ ...form, startTime: e.target.value })} className="w-full bg-surface-container border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 transition-all text-on-surface cursor-pointer" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant pl-1">End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={e => onChange({ ...form, endTime: e.target.value })} className="w-full bg-surface-container border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 transition-all text-on-surface cursor-pointer" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant pl-1">Event Category</label>
              <select value={form.eventType} onChange={e => onChange({ ...form, eventType: e.target.value })} className="w-full bg-surface-container border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 transition-all text-on-surface cursor-pointer">
                {Object.keys(EventType).map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant pl-1">Location</label>
              <input type="text" placeholder="Kitchen / Zoom / Slack" value={form.location} onChange={e => onChange({ ...form, location: e.target.value })} className="w-full bg-surface-container border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 transition-all text-on-surface" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface-variant pl-1">Description</label>
            <textarea rows={3} placeholder="Event scope, notes, etc." value={form.description} onChange={e => onChange({ ...form, description: e.target.value })} className="w-full bg-surface-container border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-surface focus:ring-2 focus:ring-brand-accent/20 transition-all text-on-surface resize-none custom-scrollbar" />
          </div>

          <div className="flex flex-wrap gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-on-surface-variant">
              <input type="checkbox" checked={form.isImportant} onChange={e => onChange({ ...form, isImportant: e.target.checked })} className="rounded text-brand-accent focus:ring-brand-accent/20 w-4 h-4 cursor-pointer" />
              Important Highlight
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-on-surface-variant">
              <input type="checkbox" checked={form.isSpecial} onChange={e => onChange({ ...form, isSpecial: e.target.checked })} className="rounded text-brand-accent focus:ring-brand-accent/20 w-4 h-4 cursor-pointer" />
              Special Occasion
            </label>
          </div>
        </div>

        <div className="bg-surface px-6 py-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:bg-surface-container text-sm font-bold px-5 py-2.5 rounded-full transition cursor-pointer">Cancel</button>
          <button type="submit" className="bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white text-sm font-bold px-5 py-2.5 rounded-full transition shadow-md hover:shadow-lg cursor-pointer">Save Event</button>
        </div>
      </form>
    </div>
  );
}
