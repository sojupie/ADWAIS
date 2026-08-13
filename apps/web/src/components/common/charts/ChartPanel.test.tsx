// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartPanel } from './ChartPanel';

describe('ChartPanel', () => {
  it('shows unavailable instead of the empty chart content when the request fails', () => {
    render(<ChartPanel title="Revenue Performance" isError>Chart content</ChartPanel>);

    expect(screen.getByRole('alert')).toHaveTextContent('Revenue Performance unavailable');
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });
});
