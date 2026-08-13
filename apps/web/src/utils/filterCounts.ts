// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

export function countActiveFilterGroups(...groups: boolean[]) {
  return groups.reduce((count, active) => count + Number(active), 0);
}
