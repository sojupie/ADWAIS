import { useMemo, type CSSProperties } from 'react';
import type { UptimeMonitorDto } from '@types';
import { filterFleetMonitors, isFleetSelectionVisible, type FleetSelection } from '../../utils/fleetFilters';
import { countActiveFilterGroups } from '../../utils/filterCounts';
import {
  FilterChip,
  FilterPanelFrame,
  FilterSectionHeader,
  FloatingFilterMenu,
} from '../common/ui/FilterMenu';
import { Select } from '../common/ui/Select';

const STATUS_OPTIONS = [
  { label: 'Up', value: 'UP' },
  { label: 'Down', value: 'DOWN' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Starting', value: 'STARTING' },
  { label: 'Unknown', value: 'UNKNOWN' },
] as const;

export interface FleetFilterMenuProps {
  monitors: UptimeMonitorDto[];
  availableTags: string[];
  selection: FleetSelection | null;
  selectedTags: string[];
  selectedStatuses: string[];
  onSelectionChange: (selection: FleetSelection | null) => void;
  onTagsChange: (tags: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
}

function monitorKey(monitor: UptimeMonitorDto) {
  return `${monitor.tenantId}:${monitor.id}`;
}

function tenantLabel(monitor: UptimeMonitorDto) {
  return monitor.tenantName || monitor.name?.split('-')[0]?.trim() || 'Tenant';
}

function toggleFilterValue(values: string[], value: string) {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

function activeFilterCount({
  selection,
  selectedTags,
  selectedStatuses,
}: Pick<FleetFilterMenuProps, 'selection' | 'selectedTags' | 'selectedStatuses'>) {
  return countActiveFilterGroups(
    Boolean(selection?.tenantId),
    selection?.monitorId != null,
    selectedTags.length > 0,
    selectedStatuses.length > 0,
  );
}

export function FleetFilterPanel({
  monitors,
  availableTags,
  selection,
  selectedTags,
  selectedStatuses,
  onSelectionChange,
  onTagsChange,
  onStatusesChange,
  embedded = false,
  floatingStyle,
}: FleetFilterMenuProps & { embedded?: boolean; floatingStyle?: CSSProperties }) {
  const eligibleMonitors = useMemo(
    () => filterFleetMonitors(monitors, { tags: selectedTags, statuses: selectedStatuses }),
    [monitors, selectedStatuses, selectedTags],
  );
  const tenants = useMemo(() => {
    const labels = new Map<string, string>();
    for (const monitor of eligibleMonitors) {
      if (!labels.has(monitor.tenantId)) labels.set(monitor.tenantId, tenantLabel(monitor));
    }
    return [...labels].sort(([, a], [, b]) => a.localeCompare(b));
  }, [eligibleMonitors]);
  const monitorOptions = useMemo(
    () => selection?.tenantId ? eligibleMonitors
      .filter(monitor => monitor.tenantId === selection.tenantId)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')) : [],
    [eligibleMonitors, selection],
  );
  const disabledTags = useMemo(() => {
    const disabledValues = new Set<string>();
    for (const tag of availableTags) {
      const isSelected = selectedTags.includes(tag);
      const candidateTags = isSelected ? selectedTags.filter(item => item !== tag) : [tag];
      const matchingMonitors = filterFleetMonitors(monitors, {
        tags: candidateTags,
        statuses: selectedStatuses,
      });
      const valid = selection
        ? isFleetSelectionVisible(matchingMonitors, selection)
        : matchingMonitors.length > 0;
      if (!valid) disabledValues.add(tag);
    }
    return disabledValues;
  }, [availableTags, monitors, selectedStatuses, selectedTags, selection]);
  const disabledStatuses = useMemo(() => {
    const disabledValues = new Set<string>();
    for (const { value } of STATUS_OPTIONS) {
      const isSelected = selectedStatuses.includes(value);
      const candidateStatuses = isSelected
        ? selectedStatuses.filter(item => item !== value)
        : [value];
      const matchingMonitors = filterFleetMonitors(monitors, {
        tags: selectedTags,
        statuses: candidateStatuses,
      });
      const valid = selection
        ? isFleetSelectionVisible(matchingMonitors, selection)
        : matchingMonitors.length > 0;
      if (!valid) disabledValues.add(value);
    }
    return disabledValues;
  }, [monitors, selectedStatuses, selectedTags, selection]);

  return (
    <FilterPanelFrame title="Filter fleet" embedded={embedded} floatingStyle={floatingStyle}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <FilterSectionHeader label="Tenant" active={Boolean(selection?.tenantId)} onClear={() => onSelectionChange(null)} />
          <Select
            aria-label="Tenant"
            value={selection?.tenantId ?? ''}
            onChange={event => onSelectionChange(event.target.value
              ? { tenantId: event.target.value, monitorId: null }
              : null)}
            variant="outlined"
            size="md"
            containerClassName="mt-1"
            className="md:text-md"
          >
            <option value="">All tenants</option>
            {tenants.map(([tenantId, label]) => <option key={tenantId} value={tenantId}>{label}</option>)}
          </Select>
        </div>

        <div className="min-w-0">
          <FilterSectionHeader
            label="Monitor"
            active={selection?.monitorId != null}
            onClear={() => onSelectionChange(selection?.tenantId
              ? { tenantId: selection.tenantId, monitorId: null }
              : null)}
          />
          <Select
            aria-label="Monitor"
            disabled={!selection?.tenantId}
            value={selection?.monitorId != null ? `${selection.tenantId}:${selection.monitorId}` : ''}
            onChange={event => {
              const monitor = eligibleMonitors.find(item => monitorKey(item) === event.target.value);
              onSelectionChange(monitor
                ? { tenantId: monitor.tenantId, monitorId: monitor.id }
                : selection?.tenantId
                  ? { tenantId: selection.tenantId, monitorId: null }
                  : null);
            }}
            variant="outlined"
            size="md"
            containerClassName="mt-1"
            className="md:text-md"
          >
            <option value="">{selection?.tenantId ? 'All monitors' : 'Select a tenant first'}</option>
            {monitorOptions.map(monitor => (
              <option key={monitorKey(monitor)} value={monitorKey(monitor)}>{monitor.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <FilterSectionHeader label="Status" active={selectedStatuses.length > 0} onClear={() => onStatusesChange([])} />
        <div className="mt-1 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              checked={selectedStatuses.includes(option.value)}
              disabled={disabledStatuses.has(option.value)}
              onChange={() => onStatusesChange(toggleFilterValue(selectedStatuses, option.value))}
            />
          ))}
        </div>
      </div>

      <div className="min-h-0">
        <FilterSectionHeader label="Tags" active={selectedTags.length > 0} onClear={() => onTagsChange([])} />
        <div className="custom-scrollbar mt-1 flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
          {availableTags.length > 0 ? availableTags.map(tag => (
            <FilterChip
              key={tag}
              label={tag}
              checked={selectedTags.includes(tag)}
              disabled={disabledTags.has(tag)}
              onChange={() => onTagsChange(toggleFilterValue(selectedTags, tag))}
            />
          )) : (
            <span className="text-sm italic text-on-surface-variant md:text-md">No tags available</span>
          )}
        </div>
      </div>
    </FilterPanelFrame>
  );
}

export function FleetFilterMenu({
  onClearAll,
  ...props
}: FleetFilterMenuProps & { onClearAll: () => void }) {
  const count = activeFilterCount(props);

  return (
    <FloatingFilterMenu
      activeCount={count}
      ariaLabel="Fleet filter controls"
      clearLabel="Clear all fleet filters"
      onClearAll={onClearAll}
      width={520}
      placement="top"
      renderPanel={floatingStyle => <FleetFilterPanel {...props} floatingStyle={floatingStyle} />}
    />
  );
}
