import { createLazyFileRoute } from '@tanstack/react-router';
import { SystemEventsView } from '../../pages/Settings/events';

export const Route = createLazyFileRoute('/settings/events')({
  component: SystemEventsView,
});
