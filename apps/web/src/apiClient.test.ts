import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './apiClient';
import { msalInstance } from './utils/msalConfig';

vi.mock('./utils/msalConfig', () => ({
  msalInstance: {
    getActiveAccount: vi.fn(),
    getAllAccounts: vi.fn(),
    acquireTokenSilent: vi.fn(),
  }
}));

const originalFetch = global.fetch;

beforeEach(() => {
  global.localStorage = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  } as any;

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({ success: true }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
});

test('apiFetch attaches MSAL token when no kiosk token exists', async () => {
  vi.mocked(msalInstance.getAllAccounts).mockReturnValue([{
    homeAccountId: '1',
    localAccountId: '1',
    environment: 'login',
    tenantId: '1',
    username: 'test@example.com',
    name: 'Test',
  }]);
  vi.mocked(msalInstance.acquireTokenSilent).mockResolvedValue({
    authority: 'https://login',
    uniqueId: '1',
    tenantId: '1',
    scopes: [],
    account: {} as any,
    idToken: 'id',
    idTokenClaims: {},
    accessToken: 'entra-token-123',
    fromCache: true,
    expiresOn: null,
    tokenType: 'Bearer',
    correlationId: '1',
  });

  await apiFetch('http://test.local');

  expect(msalInstance.acquireTokenSilent).toHaveBeenCalled();
  const fetchCall = vi.mocked(global.fetch).mock.calls[0];
  const headers = fetchCall[1]?.headers as Headers;
  expect(headers.get('Authorization')).toBe('Bearer entra-token-123');
});
