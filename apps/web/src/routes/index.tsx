import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/financial',
      search: {
        timeframe: 'T30',
      },
    });
  },
});
