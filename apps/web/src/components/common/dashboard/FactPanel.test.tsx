import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FactPanel } from './FactPanel';

describe('FactPanel', () => {
  it('reserves the extra field with N/A when PoP data is unavailable', () => {
    render(<FactPanel label="Uptime" value="N/A" hasExtra />);

    expect(screen.getAllByText('N/A')).toHaveLength(2);
  });

  it('renders available PoP data instead of the fallback', () => {
    render(<FactPanel label="Uptime" value="99.9%" hasExtra extra={{ type: 'PoP', value: 1.5 }} />);

    expect(screen.getByText('▲ 1.50% PoP')).toBeInTheDocument();
  });
});
