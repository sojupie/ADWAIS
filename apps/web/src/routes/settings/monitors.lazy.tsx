import { createLazyFileRoute } from '@tanstack/react-router';
import { MonitorsView } from '../../pages/Settings/monitors';

export const Route = createLazyFileRoute('/settings/monitors')({
  component: MonitorsView,
});
