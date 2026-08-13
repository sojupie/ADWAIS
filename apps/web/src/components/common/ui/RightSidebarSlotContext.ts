// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { createContext } from 'react';

export interface RightSidebarSlot {
  container: HTMLElement | null;
}

export const RightSidebarSlotContext = createContext<RightSidebarSlot>({
  container: null,
});
