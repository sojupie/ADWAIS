import { type Configuration, PublicClientApplication } from '@azure/msal-browser';

//motillo
// export const AZURE_CLIENT_ID = import.meta.env?.VITE_AZURE_CLIENT_ID || 'd8d5f73a-79c5-4b95-81bd-87616daf6de4';
// export const AZURE_TENANT_ID = import.meta.env?.VITE_AZURE_TENANT_ID || 'bcdca3db-b569-4df5-96b1-4bd73a557b98';
// export const AZURE_API_SCOPE = import.meta.env?.VITE_AZURE_API_SCOPE || `api://${AZURE_CLIENT_ID}/.default`;
//marmenlind
export const AZURE_CLIENT_ID = import.meta.env?.VITE_AZURE_CLIENT_ID || '19d33e62-0f9d-44ec-95fb-2216802de54e';
export const AZURE_TENANT_ID = import.meta.env?.VITE_AZURE_TENANT_ID || '75b34834-482f-447a-87bb-051f13fe8581';
export const AZURE_API_SCOPE = import.meta.env?.VITE_AZURE_API_SCOPE || `api://${AZURE_CLIENT_ID}/.default`;


export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5173',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
