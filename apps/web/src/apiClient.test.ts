import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './apiClient';
import { msalInstance } from './utils/msalConfig';
import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';

vi.mock('./utils/msalConfig', () => ({
  msalInstance: {
    getActiveAccount: vi.fn(),
    getAllAccounts: vi.fn(),
    acquireTokenSilent: vi.fn(),
  },
  AZURE_API_SCOPE: 'api://mock-scope/.default',
}));

beforeEach(() => {
  const mockLocalStorage: Storage = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  vi.stubGlobal('localStorage', mockLocalStorage);

  const mockSessionStorage = {
    clear: vi.fn(),
  };
  vi.stubGlobal('sessionStorage', mockSessionStorage);

  vi.mocked(msalInstance.getAllAccounts).mockReturnValue([]);
  vi.mocked(msalInstance.getActiveAccount).mockReturnValue(null);

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({ success: true }),
  }));
});


afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

test('apiFetch attaches MSAL token when no kiosk token exists', async () => {
  const mockAccount: AccountInfo = {
    homeAccountId: '1',
    localAccountId: '1',
    environment: 'login',
    tenantId: '1',
    username: 'test@example.com',
    name: 'Test',
  };

  vi.mocked(msalInstance.getAllAccounts).mockReturnValue([mockAccount]);
  
  const mockAuthResult: AuthenticationResult = {
    authority: 'https://login',
    uniqueId: '1',
    tenantId: '1',
    scopes: [],
    account: mockAccount,
    idToken: 'id',
    idTokenClaims: {},
    accessToken: 'entra-token-123',
    fromCache: true,
    expiresOn: null,
    tokenType: 'Bearer',
    correlationId: '1',
  };

  vi.mocked(msalInstance.acquireTokenSilent).mockResolvedValue(mockAuthResult);

  await apiFetch('http://test.local');

  expect(msalInstance.acquireTokenSilent).toHaveBeenCalled();
  const fetchCall = vi.mocked(fetch).mock.calls[0];
  const headers = fetchCall[1]?.headers as Headers;
  expect(headers.get('Authorization')).toBe('Bearer entra-token-123');
});

test('apiFetch does not redirect to /kiosk on 401 when on /login', async () => {
  const mockLocation = {
    pathname: '/login',
    href: 'http://localhost/login',
  };
  vi.stubGlobal('window', { location: mockLocation });

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    text: async () => 'Unauthorized',
  }));

  await expect(apiFetch('http://test.local')).rejects.toThrow();

  expect(mockLocation.href).toBe('http://localhost/login');
});

test('apiFetch redirects to /kiosk on 401 when on non-bypass route', async () => {
  const mockLocation = {
    pathname: '/financial',
    href: 'http://localhost/financial',
  };
  vi.stubGlobal('window', { location: mockLocation });

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    text: async () => 'Unauthorized',
  }));

  await expect(apiFetch('http://test.local')).rejects.toThrow();

  expect(mockLocation.href).toBe('/kiosk');
});

test('apiFetch redirects to /kiosk on 403 for /api/users/me when no MSAL accounts exist', async () => {
  const mockLocation = {
    pathname: '/financial',
    href: 'http://localhost/financial',
  };
  vi.stubGlobal('window', { location: mockLocation });

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 403,
    text: async () => 'Forbidden',
  }));

  await expect(apiFetch('http://test.local/api/users/me')).rejects.toThrow();

  expect(mockLocation.href).toBe('/kiosk');
});

test('apiFetch redirects to /login on 403 for /api/users/me when MSAL accounts exist', async () => {
  const mockLocation = {
    pathname: '/financial',
    href: 'http://localhost/financial',
  };
  vi.stubGlobal('window', { location: mockLocation });
  
  const mockAccount = {
    homeAccountId: '1',
    localAccountId: '1',
    environment: 'login',
    tenantId: '1',
    username: 'test@example.com',
    name: 'Test',
  };
  vi.mocked(msalInstance.getAllAccounts).mockReturnValue([mockAccount]);

  const mockSessionStorage = {
    clear: vi.fn(),
  };
  vi.stubGlobal('sessionStorage', mockSessionStorage);

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 403,
    text: async () => 'Forbidden',
  }));

  await expect(apiFetch('http://test.local/api/users/me')).rejects.toThrow();

  expect(mockSessionStorage.clear).toHaveBeenCalled();
  expect(mockLocation.href).toBe('/login');
});

test('apiFetch does not redirect on 403 for non-profile routes if session is still valid', async () => {
  const mockLocation = {
    pathname: '/financial',
    href: 'http://localhost/financial',
  };
  vi.stubGlobal('window', { location: mockLocation });

  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/users/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ role: 'Employee' }),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });
  });
  vi.stubGlobal('fetch', fetchMock);

  await expect(apiFetch('http://test.local/api/financial/summary')).rejects.toThrow();

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(fetchMock).toHaveBeenCalledWith('/api/users/me', expect.any(Object));
  expect(mockLocation.href).toBe('http://localhost/financial');
});

test('apiFetch redirects on 403 for non-profile routes if session is stale/unauthorized', async () => {
  const mockLocation = {
    pathname: '/financial',
    href: 'http://localhost/financial',
  };
  vi.stubGlobal('window', { location: mockLocation });

  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/users/me')) {
      return Promise.resolve({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });
    }
    return Promise.resolve({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });
  });
  vi.stubGlobal('fetch', fetchMock);

  await expect(apiFetch('http://test.local/api/financial/summary')).rejects.toThrow();

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(fetchMock).toHaveBeenCalledWith('/api/users/me', expect.any(Object));
  expect(mockLocation.href).toBe('/kiosk');
});


