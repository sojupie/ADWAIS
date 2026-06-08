import { createFileRoute } from '@tanstack/react-router';
import {UsersView} from "../../pages/Settings/users.tsx";

export const Route = createFileRoute('/settings/users')({
  component: UsersView,
});