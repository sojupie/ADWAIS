// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { Skeleton } from './Skeleton';

interface TableSkeletonRowsProps {
  columnCount: number;
  rowCount?: number;
}

export function TableSkeletonRows({ columnCount, rowCount = 4 }: TableSkeletonRowsProps) {
  return Array.from({ length: rowCount }, (_, rowIndex) => (
    <tr key={rowIndex} aria-hidden="true">
      {Array.from({ length: columnCount }, (_, columnIndex) => (
        <td key={columnIndex} className="px-4 py-4 sm:px-5">
          <Skeleton className={columnIndex === 0 ? 'h-4 w-4' : 'h-4 w-3/4'} />
        </td>
      ))}
    </tr>
  ));
}
