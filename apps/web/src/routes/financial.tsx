import { createFileRoute, redirect } from '@tanstack/react-router';
import { financialSearchSchema } from '../schemas';
import { getSavedTimeframe } from '../utils/timeframeStorage';

export const Route = createFileRoute('/financial')({
  validateSearch: (search) => financialSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (!search.timeframe) {
      throw redirect({
        to: '/financial',
        search: { ...search, timeframe: getSavedTimeframe('/financial') },
        replace: true,
      });
    }
  },
});
