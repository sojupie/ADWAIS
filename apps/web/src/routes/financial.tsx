import { createFileRoute } from '@tanstack/react-router';
import { Financial } from '../pages/Financial';
import { financialSearchSchema } from '../schemas';

export const Route = createFileRoute('/financial')({
  validateSearch: (search) => financialSearchSchema.parse(search),
  component: Financial,
});
