import { createFileRoute } from '@tanstack/react-router';
import {BackgroundJobsView} from "../../pages/Settings/jobs.tsx";

export const Route = createFileRoute('/settings/jobs')({
  component: BackgroundJobsView,
});

