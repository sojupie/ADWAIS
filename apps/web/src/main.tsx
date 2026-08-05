import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { queryClient } from './queryClient';
import { routeTree } from './routeTree.gen';
import './index.css';

import { AuthProvider } from 'react-oidc-context';
import { isOidcConfigured, userManager } from './utils/oidcConfig';
import { applyFlexGapFallbackClass } from './utils/flexGapSupport';
import { Md3RippleProvider } from './components/common/ui/Md3RippleProvider';

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

async function bootstrap() {
  const app = (
    <QueryClientProvider client={queryClient}>
      <Md3RippleProvider>
        <RouterProvider router={router} />
      </Md3RippleProvider>
    </QueryClientProvider>
  );

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isOidcConfigured
        ? (
          <AuthProvider
            userManager={userManager!}
            onSigninCallback={() => window.history.replaceState({}, document.title, window.location.pathname)}
          >
            {app}
          </AuthProvider>
        )
        : app}
    </StrictMode>,
  );
}

bootstrap();
