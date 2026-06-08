import { createFileRoute } from '@tanstack/react-router';
import { SystemEventsView } from "../../pages/Settings/events.tsx";

export const Route = createFileRoute('/settings/events')({
  component: SystemEventsView,
});

