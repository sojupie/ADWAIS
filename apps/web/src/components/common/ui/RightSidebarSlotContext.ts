import { createContext } from 'react';

export interface RightSidebarSlot {
  container: HTMLElement | null;
}

export const RightSidebarSlotContext = createContext<RightSidebarSlot>({
  container: null,
});
