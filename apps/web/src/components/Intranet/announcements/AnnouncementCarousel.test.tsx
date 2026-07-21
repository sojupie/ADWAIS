import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementCarousel } from './AnnouncementCarousel';

let resizeCallback: ResizeObserverCallback;

class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  observe() {}
  disconnect() {}
  unobserve() {}
}

describe('AnnouncementCarousel', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses two compact rows whenever its own height can accommodate them', () => {
    render(
      <AnnouncementCarousel>
        <div data-announcement-card>One</div>
        <div data-announcement-card>Two</div>
      </AnnouncementCarousel>,
    );
    const viewport = screen.getByLabelText('Announcements');
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 400 });

    act(() => resizeCallback([], {} as ResizeObserver));

    expect(viewport).toHaveStyle({ gridTemplateRows: 'repeat(2, 184px)' });
    expect(viewport.style.getPropertyValue('--announcement-body-lines')).toBe('1');
  });

  it('keeps one full-height row when two usable cards would not fit', () => {
    render(
      <AnnouncementCarousel>
        <div data-announcement-card>One</div>
      </AnnouncementCarousel>,
    );
    const viewport = screen.getByLabelText('Announcements');
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 300 });

    act(() => resizeCallback([], {} as ResizeObserver));

    expect(viewport).toHaveStyle({ gridTemplateRows: 'repeat(1, 234px)' });
    expect(viewport.style.getPropertyValue('--announcement-body-lines')).toBe('3');
  });
});
