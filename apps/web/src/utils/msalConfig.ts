import { type Configuration, PublicClientApplication } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env?.VITE_AZURE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env?.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5173',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
