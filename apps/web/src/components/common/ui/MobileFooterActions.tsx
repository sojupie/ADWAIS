import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MobileFooterActionsSlotContext } from './MobileFooterActionsContext';

export function MobileFooterActions({ children }: { children: ReactNode }) {
  const slot = useContext(MobileFooterActionsSlotContext);
  return slot ? createPortal(children, slot) : null;
}
