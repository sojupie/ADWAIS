// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { type ReactNode } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

interface DashboardFooterProps {
  children: ReactNode;
}

export function DashboardFooter({ children }: DashboardFooterProps) {
  const isMobileView = useMediaQuery('(max-width: 767px)');

  if (isMobileView) return null;

  return (
    <footer className="flex w-full shrink-0 flex-col flex-wrap items-center justify-between gap-4 contained:flex-row">
      {children}
    </footer>
  );
}
