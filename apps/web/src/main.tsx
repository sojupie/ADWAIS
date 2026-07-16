import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { queryClient } from './queryClient';
import { routeTree } from './routeTree.gen';
import './index.css';

import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './utils/msalConfig';
import { applyFlexGapFallbackClass } from './utils/flexGapSupport';

applyFlexGapFallbackClass();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

msalInstance.initialize().then(() => {
  return msalInstance.handleRedirectPromise();
}).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MsalProvider>
    </StrictMode>,
  );
});
