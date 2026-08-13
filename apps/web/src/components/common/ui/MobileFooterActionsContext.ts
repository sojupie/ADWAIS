// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { createContext } from 'react';

export interface MobileFooterActionsSlots {
  panel: HTMLElement | null;
  indicator: HTMLElement | null;
  quickAction: HTMLElement | null;
}

export const MobileFooterActionsSlotContext = createContext<MobileFooterActionsSlots>({
  panel: null,
  indicator: null,
  quickAction: null,
});
