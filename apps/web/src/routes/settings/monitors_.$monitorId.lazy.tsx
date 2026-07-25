import { createLazyFileRoute } from '@tanstack/react-router';
import { MonitorDetailView } from '../../pages/Settings/MonitorDetail';

export const Route = createLazyFileRoute('/settings/monitors_/$monitorId')({
  component: MonitorDetailView,
});
