import { createFileRoute, redirect } from '@tanstack/react-router';
import { fleetSearchSchema } from '../schemas';
import { getSavedTimeframe } from '../utils/timeframeStorage';

export const Route = createFileRoute('/fleet-status')({
  validateSearch: (search) => fleetSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (!search.timeframe) {
      throw redirect({
        to: '/fleet-status',
        search: { ...search, timeframe: getSavedTimeframe('/fleet-status') },
        replace: true,
      });
    }
  },
});
