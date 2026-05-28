import { createLazyFileRoute } from '@tanstack/react-router';
import { FleetStatus } from '../pages/FleetStatus';

export const Route = createLazyFileRoute('/fleet-status')({
  component: FleetStatus,
});
