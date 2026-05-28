import { createFileRoute } from '@tanstack/react-router';
import { fleetSearchSchema } from '../schemas';

export const Route = createFileRoute('/fleet-status')({
  validateSearch: (search) => fleetSearchSchema.parse(search),
});
