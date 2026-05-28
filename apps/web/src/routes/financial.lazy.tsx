import { createLazyFileRoute } from '@tanstack/react-router';
import { Financial } from '../pages/Financial';

export const Route = createLazyFileRoute('/financial')({
  component: Financial,
});
