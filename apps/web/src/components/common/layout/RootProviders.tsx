import type {ReactNode} from 'react';
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {Toaster} from 'sonner';
import {KioskProvider} from '../dashboard/KioskProvider';

export function RootProviders({children}: { children: ReactNode }) {
  return (
    <KioskProvider>
      {children}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      <Toaster closeButton richColors theme="light" />
    </KioskProvider>
  );
}
