import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UptimeMonitorDto } from '@types';
import { FleetFilterMenu } from './FleetFilterMenu';

const monitors = [
  { id: 1, tenantId: 'tenant-a', tenantName: 'Alpha', name: 'Storefront', tags: ['prod'], currentStatus: 'UP' },
  { id: 2, tenantId: 'tenant-b', tenantName: 'Beta', name: 'Backoffice', tags: ['dev'], currentStatus: 'DOWN' },
  { id: 3, tenantId: 'tenant-a', tenantName: 'Alpha', name: 'Worker', tags: ['dev'], currentStatus: 'DOWN' },
] as UptimeMonitorDto[];

const baseProps = {
  monitors,
  availableTags: ['dev', 'prod'],
  selection: null,
  selectedTags: [],
  selectedStatuses: [],
  onSelectionChange: vi.fn(),
  onTagsChange: vi.fn(),
  onStatusesChange: vi.fn(),
  onClearAll: vi.fn(),
};

describe('FleetFilterMenu', () => {
  it('provides explicit tenant and monitor controls', () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(<FleetFilterMenu {...baseProps} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByRole('button', { name: /^filters(?:, \d+ active)?$/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('combobox', { name: 'Tenant' })).toHaveFocus();

    expect(screen.getByRole('combobox', { name: 'Monitor' })).toBeDisabled();

    fireEvent.click(screen.getByRole('combobox', { name: 'Tenant' }));
    const alphaOption = screen.getByRole('option', { name: 'Alpha' });
    fireEvent.pointerDown(alphaOption);
    fireEvent.click(alphaOption);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ tenantId: 'tenant-a', monitorId: null });
    expect(screen.getByRole('button', { name: /^filters(?:, \d+ active)?$/i })).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <FleetFilterMenu
        {...baseProps}
        selection={{ tenantId: 'tenant-a', monitorId: null }}
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Monitor' }));
    fireEvent.click(screen.getByRole('option', { name: 'Storefront' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ tenantId: 'tenant-a', monitorId: 1 });
  });

  it('updates and clears each multi-select facet independently', () => {
    const onTagsChange = vi.fn();
    const onStatusesChange = vi.fn();
    const { rerender } = render(
      <FleetFilterMenu {...baseProps} onTagsChange={onTagsChange} onStatusesChange={onStatusesChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^filters(?:, \d+ active)?$/i }));
    const prodChip = screen.getByRole('button', { name: 'prod' });
    expect(prodChip).toHaveAttribute('aria-pressed', 'false');
    expect(prodChip.querySelector('svg')).not.toBeInTheDocument();
    fireEvent.click(prodChip);
    expect(onTagsChange).toHaveBeenCalledWith(['prod']);
    fireEvent.click(screen.getByRole('button', { name: 'Down' }));
    expect(onStatusesChange).toHaveBeenCalledWith(['DOWN']);

    rerender(
      <FleetFilterMenu
        {...baseProps}
        selectedTags={['prod']}
        selectedStatuses={['DOWN']}
        onTagsChange={onTagsChange}
        onStatusesChange={onStatusesChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'prod' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'prod' }).querySelector('svg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear tags' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear status' }));
    expect(onTagsChange).toHaveBeenLastCalledWith([]);
    expect(onStatusesChange).toHaveBeenLastCalledWith([]);
  });

  it('removes tenants and monitors excluded by the active facets', () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <FleetFilterMenu
        {...baseProps}
        selectedTags={['prod']}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^filters(?:, \d+ active)?$/i }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Tenant' }));
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Beta' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Alpha' }));

    rerender(
      <FleetFilterMenu
        {...baseProps}
        selection={{ tenantId: 'tenant-a', monitorId: null }}
        selectedTags={['prod']}
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Monitor' }));
    expect(screen.getByRole('option', { name: 'Storefront' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Worker' })).not.toBeInTheDocument();
  });

  it('disables chip actions that do not apply to the current scope', () => {
    const onTagsChange = vi.fn();
    const onStatusesChange = vi.fn();
    const { rerender } = render(
      <FleetFilterMenu
        {...baseProps}
        selection={{ tenantId: 'tenant-a', monitorId: 1 }}
        onTagsChange={onTagsChange}
        onStatusesChange={onStatusesChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^filters(?:, \d+ active)?$/i }));
    expect(screen.getByRole('button', { name: 'prod' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'dev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Down' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'dev' }));
    fireEvent.click(screen.getByRole('button', { name: 'Down' }));
    expect(onTagsChange).not.toHaveBeenCalled();
    expect(onStatusesChange).not.toHaveBeenCalled();

    rerender(
      <FleetFilterMenu
        {...baseProps}
        selection={{ tenantId: 'tenant-a', monitorId: 1 }}
        selectedTags={['prod', 'dev']}
        onTagsChange={onTagsChange}
        onStatusesChange={onStatusesChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'prod' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'dev' })).toBeEnabled();
  });

  it('keeps reset in the connected control surface with a disabled state', () => {
    const onClearAll = vi.fn();
    const { rerender } = render(<FleetFilterMenu {...baseProps} onClearAll={onClearAll} />);

    const reset = screen.getByRole('button', { name: 'Clear all fleet filters' });
    expect(reset).toBeDisabled();
    expect(reset.closest('[role="group"]')).toBe(screen.getByRole('group', { name: 'Fleet filter controls' }));

    rerender(
      <FleetFilterMenu
        {...baseProps}
        selection={{ tenantId: 'tenant-a', monitorId: null }}
        onClearAll={onClearAll}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear all fleet filters' }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });
});
