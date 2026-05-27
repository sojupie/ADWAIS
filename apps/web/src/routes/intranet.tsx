import { createFileRoute } from '@tanstack/react-router';
import { Intranet } from '../pages/Intranet';

export const Route = createFileRoute('/intranet')({
  component: Intranet,
});
