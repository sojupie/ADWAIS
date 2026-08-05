import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RecurringJobsTable } from './RecurringJobsTable';

it('explains failed scheduled jobs instead of showing a perpetual skeleton', () => {
  render(<RecurringJobsTable recurring={undefined} isLoading={false} isError />);

  expect(screen.getByRole('alert')).toHaveTextContent('Unable to load scheduled jobs.');
});
