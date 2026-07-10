import { X, Clock, MapPin, User as UserIcon, Globe } from 'lucide-react';
import type { OfficeEventDto } from '@types';

interface EventDetailModalProps {
  event: OfficeEventDto;
  isOpen: boolean;
  onClose: () => void;
  isWriter: boolean;
  onDelete: (id: string) => void;
  onEdit: (event: OfficeEventDto) => void;
}

const BADGE_STYLES: Record<string, string> = {
  Meeting: 'bg-blue-100 text-blue-800 border-0',
  Fika: 'bg-orange-100 text-orange-800 border-0',
  Social: 'bg-purple-100 text-purple-800 border-0',
  Birthday: 'bg-pink-100 text-pink-800 border-0',
  GoLive: 'bg-emerald-100 text-emerald-800 border-0',
  ExternalSync: 'bg-cyan-100 text-cyan-800 border-0',
};

const DEFAULT_BADGE = 'bg-surface-container text-on-surface border-0';

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  isWriter,
  onDelete,
  onEdit
}: EventDetailModalProps) {
  if (!isOpen) return null;

  const badgeClass = BADGE_STYLES[event.eventType || ''] ?? DEFAULT_BADGE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface rounded-3xl shadow-2xl border-0 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
        <div className="flex justify-between items-center bg-surface px-6 py-5 pb-2">
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${badgeClass}`}>
            {event.eventType || 'Event'}
          </span>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface-variant cursor-pointer p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 pt-2 flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-bold text-on-surface leading-snug">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-on-surface-variant mt-3 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-2 text-on-surface-variant text-sm border-t border-outline-variant pt-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-on-surface-variant shrink-0" />
              <span>
                {event.startTime && new Date(event.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                <span className="font-bold text-on-surface ml-1.5">
                  {event.startTime && new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {event.endTime && new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-on-surface-variant shrink-0" />
                <span className="font-medium text-on-surface-variant">{event.location}</span>
              </div>
            )}

            {event.userName && (
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-on-surface-variant shrink-0" />
                <span>Created by <span className="font-bold text-on-surface">{event.userName}</span></span>
              </div>
            )}

            {event.externalUid && (
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-on-surface-variant shrink-0" />
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Synced Event
                </span>
              </div>
            )}
          </div>

          {isWriter && !event.externalUid && (
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => event.id && onDelete(event.id)}
                className="text-red-600 hover:bg-red-50 text-sm font-bold px-5 py-2.5 rounded-full transition cursor-pointer"
              >
                Delete
              </button>
              <button 
                onClick={() => onEdit(event)}
                className="bg-brand-btn-primary hover:bg-brand-btn-quaternary text-white text-sm font-bold px-5 py-2.5 rounded-full transition shadow-md hover:shadow-lg cursor-pointer"
              >
                Edit Event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
