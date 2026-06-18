import { createLazyFileRoute } from '@tanstack/react-router';
import { BackgroundJobsView } from '../../pages/Settings/jobs';

export const Route = createLazyFileRoute('/settings/jobs')({
  component: BackgroundJobsView,
});
