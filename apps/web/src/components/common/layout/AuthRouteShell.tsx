import {Outlet} from '@tanstack/react-router';
import {AuthLayout} from './AuthLayout';
import {AuthCard} from './AuthCard';

export function AuthRouteShell({routeKey}: { routeKey: string }) {
  return (
    <AuthLayout>
      <AuthCard>
        <div key={routeKey} className="flex-1 flex flex-col justify-between min-h-full">
          <Outlet />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
