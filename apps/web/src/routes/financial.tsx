import { createFileRoute } from '@tanstack/react-router';
import { financialSearchSchema } from '../schemas';

export const Route = createFileRoute('/financial')({
  validateSearch: (search) => financialSearchSchema.parse(search),
});
