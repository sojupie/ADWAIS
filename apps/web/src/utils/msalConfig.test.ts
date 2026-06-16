import { test, expect } from 'vitest';
import { msalConfig, msalInstance } from './msalConfig';

test('msalConfig maps env vars to Azure authority and clientId', () => {
  expect(msalInstance).toBeDefined();
  expect(msalConfig.auth.clientId).toBeDefined();
  expect(msalConfig.auth.authority).toContain('login.microsoftonline.com');
});
