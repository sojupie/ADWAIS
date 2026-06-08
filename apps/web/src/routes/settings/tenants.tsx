import { createFileRoute } from '@tanstack/react-router';
import {TenantsMonitorsView} from "../../pages/Settings/tenants.tsx";


export const Route = createFileRoute('/settings/tenants')({
  component: TenantsMonitorsView,
});


