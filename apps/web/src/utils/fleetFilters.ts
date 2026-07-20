import type { UptimeMonitorDto } from '@types';
import { normalizeStatus } from './monitorStatusHelper';

export interface FleetFilters {
  tags: string[];
  statuses: string[];
}

export interface FleetSelection {
  tenantId: string;
  monitorId: number | null;
}

const normalizeFilterValue = (value: string) => value.trim().toLocaleLowerCase();

export function getFleetTags(monitors: UptimeMonitorDto[]): string[] {
  const tagsByNormalizedValue = new Map<string, string>();

  for (const monitor of monitors) {
    for (const rawTag of monitor.tags ?? []) {
      const tag = rawTag.trim();
      if (tag) tagsByNormalizedValue.set(normalizeFilterValue(tag), tag);
    }
  }

  return [...tagsByNormalizedValue.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

export function filterFleetMonitors(
  monitors: UptimeMonitorDto[],
  { tags, statuses }: FleetFilters,
): UptimeMonitorDto[] {
  const selectedTags = new Set(tags.map(normalizeFilterValue));
  const selectedStatuses = new Set(statuses.map(normalizeStatus));

  if (selectedTags.size === 0 && selectedStatuses.size === 0) return monitors;

  return monitors.filter(monitor => {
    const matchesTag = selectedTags.size === 0 || (monitor.tags ?? []).some(tag =>
      selectedTags.has(normalizeFilterValue(tag)),
    );
    const matchesStatus = selectedStatuses.size === 0 ||
      selectedStatuses.has(normalizeStatus(monitor.currentStatus));

    return matchesTag && matchesStatus;
  });
}

export function isFleetSelectionVisible(
  monitors: UptimeMonitorDto[],
  selection: FleetSelection,
): boolean {
  return monitors.some(monitor =>
    monitor.tenantId === selection.tenantId &&
    (selection.monitorId === null || monitor.id === selection.monitorId),
  );
}
