// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import type { ReactNode } from "react";

export function DashboardLayout({ children, className = '' }: { children: ReactNode, className?: string }) {
    return (
        <div className={`flex flex-col gap-4 w-full pb-3 ${className || 'contained:min-h-full contained:flex-1 contained:min-h-0'}`}>
            {children}
        </div>
    );
}