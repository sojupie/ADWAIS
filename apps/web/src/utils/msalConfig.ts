import { Configuration, PublicClientApplication } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env?.VITE_AZURE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env?.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: '/',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
