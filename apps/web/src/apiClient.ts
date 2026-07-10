import { msalInstance, AZURE_API_SCOPE } from './utils/msalConfig';

export async function getAuthHeaders(customHeaders?: HeadersInit): Promise<Headers> {
  const headers = new Headers(customHeaders);
  const kioskToken = localStorage.getItem('kiosk_token');
  if (kioskToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${kioskToken}`);
  } else if (!headers.has('Authorization')) {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (account) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          scopes: [AZURE_API_SCOPE],
          account: account
        });
        headers.set('Authorization', `Bearer ${response.accessToken}`);
      } catch (e) {
        console.warn('Failed to acquire silent token', e);
      }
    }
  }
  return headers;
}

export function handleSessionInvalidation() {
  if (window.location.pathname === '/kiosk' || window.location.pathname === '/login') {
    return;
  }
  const hasMsal = msalInstance.getAllAccounts().length > 0;
  if (hasMsal) {
    sessionStorage.clear();
    window.location.href = '/login';
  } else {
    localStorage.removeItem('kiosk_token');
    window.location.href = '/kiosk';
  }
}

let isCheckingSession = false;

export async function checkSessionValidity() {
  if (isCheckingSession) return;
  isCheckingSession = true;
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/users/me', { headers });
    if (response.status === 401 || response.status === 403) {
      handleSessionInvalidation();
    }
  } catch (e) {
    console.error('Failed to verify session validity:', e);
  } finally {
    isCheckingSession = false;
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const isBodyRequest = options?.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase());
  const headers = await getAuthHeaders(options?.headers);

  if (isBodyRequest && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const isProfileUrl = url.includes('/api/users/me');
    if (response.status === 401 || response.status === 403) {
      if (isProfileUrl) {
        const bypass = headers.get('X-Bypass-Global-401');
        if (bypass !== 'true') {
          handleSessionInvalidation();
        }
      } else {
        checkSessionValidity().catch((err) => {
          console.error('Error during session validity check:', err);
        });
      }
    }

    const errorBody = await response.text().catch(() => 'Unknown error');
    console.error(`API Fetch Error [${response.status}] ${url}:`, errorBody);
    let errorMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error) errorMessage = parsed.error;
      else if (parsed.message) errorMessage = parsed.message;
    } catch {
      // Not JSON
    }
    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return null as unknown as T;
  }
  return JSON.parse(text);
}

export interface MutatorConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export async function customClient<T>(config: MutatorConfig): Promise<T>;
export async function customClient<T>(url: string, config?: RequestInit): Promise<T>;
export async function customClient<T>(
  first: string | MutatorConfig,
  second?: RequestInit
): Promise<T> {
  if (typeof first === 'string') {
    const url = first;
    const options = second;
    const isBodyRequest = options?.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase());
    const headers = await getAuthHeaders(options?.headers);

    if (isBodyRequest && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const isProfileUrl = url.includes('/api/users/me');
      if (response.status === 401 || response.status === 403) {
        if (isProfileUrl) {
          const bypass = headers.get('X-Bypass-Global-401');
          if (bypass !== 'true') {
            handleSessionInvalidation();
          }
        } else {
          checkSessionValidity().catch((err) => {
            console.error('Error during session validity check:', err);
          });
        }
      }

      const errorBody = await response.text().catch(() => 'Unknown error');
      console.error(`API Fetch Error [${response.status}] ${url}:`, errorBody);
      let errorMessage = errorBody;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error) errorMessage = parsed.error;
        else if (parsed.message) errorMessage = parsed.message;
      } catch {
        // Not JSON
      }
      throw new Error(errorMessage || `Request failed with status ${response.status}`);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return {
      data,
      status: response.status,
      headers: response.headers,
    } as unknown as T;
  }

  const { url, method, params, data, headers, signal } = first;

  // Build query string if params exist
  let fullUrl = url;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
    signal,
  };

  if (data !== undefined) {
    options.body = JSON.stringify(data);
  }

  return apiFetch<T>(fullUrl, options);
}

