export function countActiveFilterGroups(...groups: boolean[]) {
  return groups.reduce((count, active) => count + Number(active), 0);
}
