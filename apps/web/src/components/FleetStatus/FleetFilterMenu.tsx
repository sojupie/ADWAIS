import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {Check, Filter, ListRestart, X} from 'lucide-react';
import type { UptimeMonitorDto } from '@types';
import { filterFleetMonitors, isFleetSelectionVisible, type FleetSelection } from '../../utils/fleetFilters';
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
  return Number(Boolean(selection?.tenantId)) +
    Number(selection?.monitorId != null) +
    Number(selectedTags.length > 0) +
    Number(selectedStatuses.length > 0);
}

function SectionHeader({ label, active, onClear }: {
  label: string;
  active: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <span className="text-sm font-black uppercase tracking-widest text-on-surface-variant md:text-md">{label}</span>
      <button
        type="button"
        disabled={!active}
        onClick={onClear}
        aria-label={`Clear ${label.toLowerCase()}`}
        className="min-h-9 cursor-pointer rounded-full bg-surface-container-low px-3 py-1 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:pointer-events-none disabled:opacity-0 md:text-md"
      >
        Clear
      </button>
    </div>
  );
}

function FilterChip({ label, checked, disabled, onChange }: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={onChange}
      className={`inline-flex h-8 cursor-pointer items-center rounded-lg border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-on-surface/[0.10] disabled:text-on-surface/[0.38] md:text-md ${
      checked
        ? 'gap-2 border-transparent bg-secondary-container px-2 text-on-secondary-container hover:bg-secondary-container/80'
        : 'border-outline-variant bg-surface px-4 text-on-surface-variant hover:bg-surface-container-low'
    }`}>
      {checked && <Check aria-hidden="true" size={18} strokeWidth={2.5} className="shrink-0" />}
      {label}
    </button>
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
    <div
      data-fleet-filter-panel={!embedded ? '' : undefined}
      style={floatingStyle}
      className={embedded
      ? 'flex flex-col gap-4 p-4'
      : 'fixed z-[200] flex flex-col gap-4 overflow-y-auto rounded-3xl border border-outline-variant bg-surface p-4 m3-elevation-4'}>
      <div className="flex items-center gap-4 border-b border-outline-variant pb-3">
        <h2 className="m-0 text-md font-black text-on-surface">Filter fleet</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <SectionHeader label="Tenant" active={Boolean(selection?.tenantId)} onClear={() => onSelectionChange(null)} />
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
          <SectionHeader
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
        <SectionHeader label="Status" active={selectedStatuses.length > 0} onClear={() => onStatusesChange([])} />
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
        <SectionHeader label="Tags" active={selectedTags.length > 0} onClear={() => onTagsChange([])} />
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
    </div>
  );
}

export function FleetFilterMenu({
  onClearAll,
  ...props
}: FleetFilterMenuProps & { onClearAll: () => void }) {
  const controlsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    opensAbove: boolean;
  } | null>(null);
  const count = activeFilterCount(props);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const viewportMargin = 16;
    const menuGap = 12;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(520, window.innerWidth - viewportMargin * 2);
    const left = Math.max(
      viewportMargin,
      Math.min(rect.left, window.innerWidth - width - viewportMargin),
    );
    const spaceAbove = rect.top - viewportMargin - menuGap;
    const spaceBelow = window.innerHeight - rect.bottom - viewportMargin - menuGap;
    const opensAbove = spaceAbove >= spaceBelow;

    setMenuPosition({
      left,
      top: opensAbove ? rect.top - menuGap : rect.bottom + menuGap,
      width,
      maxHeight: Math.max(96, opensAbove ? spaceAbove : spaceBelow),
      opensAbove,
    });
  }, [setMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const close = (restoreFocus = false) => {
      setIsOpen(false);
      if (restoreFocus) triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (controlsRef.current?.contains(target as Node)) return;
      if (panelRef.current?.contains(target as Node)) return;
      if (target instanceof Element && target.closest('[data-select-menu]')) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('[data-select-menu]')) return;
      close(true);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const toggleMenu = () => {
    if (!isOpen) updateMenuPosition();
    setIsOpen(open => !open);
  };

  return (
    <div
      ref={controlsRef}
      role="group"
      aria-label="Fleet filter controls"
      className={`relative flex items-center min-h-14 pr-3 p-1 gap-1 overflow-hidden bg-transparent`}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label={count > 0 ? `Filters, ${count} active` : 'Filters'}
        className={`flex h-14 cursor-pointer items-center justify-center gap-2 rounded-l-[28px] rounded-r-[8px] m3-elevation-1 hover:m3-elevation-2 bg-surface px-5 py-2 text-sm font-black hover: uppercase tracking-widest outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary md:text-md}`}>
        <Filter aria-hidden="true" size={20} strokeWidth={2.5} />
        Filters
        {count > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary-container px-2 text-sm text-on-secondary-container">
            {count}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onClearAll}
        disabled={count === 0}
        aria-label="Clear all fleet filters"
        title="Clear all fleet filters"
        className="flex w-14 h-14 cursor-pointer items-center pr-1 justify-center rounded-r-[28px] rounded-l-[8px] enabled:m3-elevation-1 enabled:hover:m3-elevation-2 bg-error-container enabled:hover:bg-error/20 text-on-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary disabled:cursor-not-allowed disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38]"
      >
        <ListRestart aria-hidden="true" size={20} strokeWidth={2.5} />
      </button>
      {isOpen && menuPosition && createPortal(
        <div ref={panelRef}>
          <FleetFilterPanel
            {...props}
            floatingStyle={{
              left: menuPosition.left,
              top: menuPosition.top,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              transform: menuPosition.opensAbove ? 'translateY(-100%)' : undefined,
            }}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
