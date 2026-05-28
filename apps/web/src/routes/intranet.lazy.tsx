import { createLazyFileRoute } from '@tanstack/react-router';
import { Intranet } from '../pages/Intranet';

export const Route = createLazyFileRoute('/intranet')({
  component: Intranet,
});
