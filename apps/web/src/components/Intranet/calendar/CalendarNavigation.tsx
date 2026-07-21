import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarNavigationProps {
  label: string;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
}

export function CalendarNavigation({ label, onPrevious, onToday, onNext }: CalendarNavigationProps) {
  const buttonClass = 'flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors border border-surface-container-highest hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary';
  return (
    <div className="flex flex-wrap gap-2 items-center justify-end bg-surface px-5 pb-2">
      <h3 className="text-sm flex flex-1 whitespace-nowrap font-black uppercase tracking-wider text-on-surface">{label}</h3>
      <div className="flex items-center gap-1">
        <button onClick={onPrevious} className={buttonClass} aria-label="Previous period"><ChevronLeft size={20} /></button>
        <button onClick={onToday} className="border border-surface-container-highest hover:bg-surface-container inline-flex min-h-9 items-center justify-center rounded-full px-4 text-md font-bold uppercase tracking-wider text-on-surface transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary">Today</button>
        <button onClick={onNext} className={buttonClass} aria-label="Next period"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
