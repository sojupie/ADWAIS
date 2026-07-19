import { useEffect, type ReactNode } from 'react';

const RIPPLE_SELECTOR = [
  'button:not(:disabled):not([data-md3-ripple="off"])',
  '[role="button"]:not([aria-disabled="true"]):not([data-md3-ripple="off"])',
  '[data-md3-ripple]:not([data-md3-ripple="off"]):not([aria-disabled="true"])',
].join(',');

const ACTIVE_CLASS = 'md3-ripple-active';
const RELEASING_CLASS = 'md3-ripple-releasing';
const RIPPLE_LIFETIME_MS = 750;
const MIN_VISIBLE_MS = 90;

type RippleState = {
  element: HTMLElement;
  startFrame: number;
  startedAt: number | null;
  releaseTimer: number | null;
  cleanupTimer: number | null;
  released: boolean;
};

function findRippleTarget(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(RIPPLE_SELECTOR) : null;
}

function setRippleOrigin(element: HTMLElement, clientX?: number, clientY?: number) {
  const rect = element.getBoundingClientRect();
  const x = clientX == null ? rect.width / 2 : clientX - rect.left;
  const y = clientY == null ? rect.height / 2 : clientY - rect.top;
  const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
  element.style.setProperty('--md3-ripple-x', `${x}px`);
  element.style.setProperty('--md3-ripple-y', `${y}px`);
  element.style.setProperty('--md3-ripple-size', `${radius * 2}px`);
  element.style.setProperty('--md3-ripple-color', getComputedStyle(element).color);
}

export function Md3RippleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const pointerRipples = new Map<number, RippleState>();
    const keyboardRipples = new Map<HTMLElement, RippleState>();
    const elementRipples = new WeakMap<HTMLElement, RippleState>();

    const clearState = (state: RippleState) => {
      window.cancelAnimationFrame(state.startFrame);
      if (state.releaseTimer !== null) window.clearTimeout(state.releaseTimer);
      if (state.cleanupTimer !== null) window.clearTimeout(state.cleanupTimer);
      state.element.classList.remove(ACTIVE_CLASS, RELEASING_CLASS);
      if (elementRipples.get(state.element) === state) elementRipples.delete(state.element);
    };

    const finishRelease = (state: RippleState) => {
      if (elementRipples.get(state.element) !== state || state.releaseTimer !== null) return;
      const elapsed = state.startedAt === null ? 0 : performance.now() - state.startedAt;
      state.releaseTimer = window.setTimeout(() => {
        state.releaseTimer = null;
        if (elementRipples.get(state.element) !== state) return;
        state.element.classList.add(RELEASING_CLASS);
        state.cleanupTimer = window.setTimeout(() => clearState(state), RIPPLE_LIFETIME_MS);
      }, Math.max(0, MIN_VISIBLE_MS - elapsed));
    };

    const begin = (element: HTMLElement, clientX?: number, clientY?: number): RippleState => {
      const previous = elementRipples.get(element);
      if (previous) clearState(previous);
      setRippleOrigin(element, clientX, clientY);
      element.classList.remove(ACTIVE_CLASS, RELEASING_CLASS);
      void getComputedStyle(element, '::before').transform;
      const state: RippleState = {
        element,
        startFrame: 0,
        startedAt: null,
        releaseTimer: null,
        cleanupTimer: null,
        released: false,
      };
      elementRipples.set(element, state);
      state.startFrame = window.requestAnimationFrame(() => {
        state.startFrame = window.requestAnimationFrame(() => {
          if (elementRipples.get(element) !== state) return;
          element.classList.add(ACTIVE_CLASS);
          state.startedAt = performance.now();
          if (state.released) finishRelease(state);
        });
      });
      return state;
    };

    const release = (state: RippleState) => {
      if (state.released) return;
      state.released = true;
      if (state.startedAt !== null) finishRelease(state);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const element = findRippleTarget(event.target);
      if (!element) return;
      pointerRipples.set(event.pointerId, begin(element, event.clientX, event.clientY));
    };

    const handlePointerRelease = (event: PointerEvent) => {
      const state = pointerRipples.get(event.pointerId);
      if (!state) return;
      pointerRipples.delete(event.pointerId);
      release(state);
    };

    const handlePointerOut = (event: PointerEvent) => {
      const state = pointerRipples.get(event.pointerId);
      if (!state || state.element.contains(event.relatedTarget as Node | null)) return;
      pointerRipples.delete(event.pointerId);
      release(state);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      const element = findRippleTarget(event.target);
      if (!element || keyboardRipples.has(element)) return;
      keyboardRipples.set(element, begin(element));
    };

    const releaseKeyboardRipple = (target: EventTarget | null) => {
      const element = findRippleTarget(target);
      if (!element) return;
      const state = keyboardRipples.get(element);
      if (!state) return;
      keyboardRipples.delete(element);
      release(state);
    };
    const handleKeyUp = (event: KeyboardEvent) => releaseKeyboardRipple(event.target);
    const handleFocusOut = (event: FocusEvent) => releaseKeyboardRipple(event.target);

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerRelease);
    document.addEventListener('pointercancel', handlePointerRelease);
    document.addEventListener('pointerout', handlePointerOut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerRelease);
      document.removeEventListener('pointercancel', handlePointerRelease);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('focusout', handleFocusOut);
      pointerRipples.forEach(clearState);
      keyboardRipples.forEach(clearState);
    };
  }, []);

  return children;
}
