import { createFileRoute } from '@tanstack/react-router';
import { FleetStatus } from '../pages/FleetStatus';
import { fleetSearchSchema } from '../schemas';

export const Route = createFileRoute('/fleet-status')({
  validateSearch: (search) => fleetSearchSchema.parse(search),
  component: FleetStatus,
});
