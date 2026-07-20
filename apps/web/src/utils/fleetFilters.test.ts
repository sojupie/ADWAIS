import { describe, expect, it } from 'vitest';
import type { UptimeMonitorDto } from '@types';
import { filterFleetMonitors, getFleetTags, isFleetSelectionVisible } from './fleetFilters';

const monitor = (
  id: number,
  tags: string[],
  currentStatus: string,
): UptimeMonitorDto => ({
  id,
  tenantId: `tenant-${id}`,
  name: `Monitor ${id}`,
  tags,
  currentStatus,
  uptimeMonitorEnabled: true,
} as UptimeMonitorDto);

describe('fleet filters', () => {
  const monitors = [
    monitor(1, ['prod', 'dev'], 'UP'),
    monitor(2, ['prod'], 'DOWN'),
    monitor(3, ['status:paused'], 'PAUSED'),
  ];

  it('keeps tag options independent from the filtered result', () => {
    expect(getFleetTags(monitors)).toEqual(['dev', 'prod', 'status:paused']);
    expect(getFleetTags(filterFleetMonitors(monitors, { tags: ['dev'], statuses: [] })))
      .toEqual(['dev', 'prod']);
  });

  it('matches any selected tag within the tag facet', () => {
    expect(filterFleetMonitors(monitors, { tags: ['prod', 'dev'], statuses: [] }).map(({ id }) => id))
      .toEqual([1, 2]);
  });

  it('matches tags case-insensitively without discarding namespaced values', () => {
    expect(filterFleetMonitors(monitors, { tags: ['STATUS:PAUSED'], statuses: [] }).map(({ id }) => id))
      .toEqual([3]);
  });

  it('combines tag and status facets with AND semantics', () => {
    expect(filterFleetMonitors(monitors, { tags: ['prod'], statuses: ['down'] }).map(({ id }) => id))
      .toEqual([2]);
  });

  it('reports when a selected tenant or monitor is no longer visible', () => {
    const visibleMonitors = filterFleetMonitors(monitors, { tags: ['dev'], statuses: [] });

    expect(isFleetSelectionVisible(visibleMonitors, { tenantId: 'tenant-1', monitorId: 1 })).toBe(true);
    expect(isFleetSelectionVisible(visibleMonitors, { tenantId: 'tenant-1', monitorId: null })).toBe(true);
    expect(isFleetSelectionVisible(visibleMonitors, { tenantId: 'tenant-2', monitorId: 2 })).toBe(false);
  });
});
