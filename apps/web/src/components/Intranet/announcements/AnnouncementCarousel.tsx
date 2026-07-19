import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_HEIGHT = 234;
const CARD_GAP = 16;
const COMPACT_WIDTH = 640;

interface AnnouncementCarouselProps {
  children: ReactNode;
}

export function AnnouncementCarousel({ children }: AnnouncementCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [rowCount, setRowCount] = useState(1);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateOverflow = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanScrollBack(viewport.scrollLeft > 1);
    setCanScrollForward(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateLayout = () => {
      const nextRows = viewport.clientWidth < COMPACT_WIDTH
        ? 1
        : Math.max(1, Math.floor((viewport.clientHeight + CARD_GAP) / (CARD_HEIGHT + CARD_GAP)));
      setRowCount(nextRows);
      window.requestAnimationFrame(updateOverflow);
    };

    updateLayout();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateLayout);
    observer?.observe(viewport);
    window.addEventListener('resize', updateLayout);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [updateOverflow]);

  const scroll = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const card = viewport.querySelector<HTMLElement>('[data-announcement-card]');
    const distance = (card?.offsetWidth ?? Math.min(352, viewport.clientWidth)) + CARD_GAP;
    viewport.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={viewportRef}
        onScroll={updateOverflow}
        className="grid h-full min-h-0 snap-x snap-mandatory grid-flow-col content-start items-start gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain p-4 pt-0 scroll-px-4 custom-scrollbar md:snap-proximity"
        style={{
          gridTemplateRows: `repeat(${rowCount}, ${CARD_HEIGHT}px)`,
          gridAutoColumns: 'minmax(17rem, 22rem)',
        }}
        aria-label="Announcements"
      >
        {children}
      </div>

      {canScrollBack && (
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous announcements" className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-on-surface m3-elevation-2 hover:bg-surface-container-high md:flex">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      {canScrollForward && (
        <button type="button" onClick={() => scroll(1)} aria-label="Next announcements" className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-on-surface m3-elevation-2 hover:bg-surface-container-high md:flex">
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
