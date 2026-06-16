export const KIOSK_DEVICE_ID_KEY = 'kiosk_device_id';
export const KIOSK_TOKEN_KEY = 'kiosk_token';

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(KIOSK_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `kiosk-${crypto.randomUUID()}`;
    localStorage.setItem(KIOSK_DEVICE_ID_KEY, deviceId);
    document.cookie = `${KIOSK_DEVICE_ID_KEY}=${deviceId}; path=/; max-age=31536000; samesite=strict`;
  }
  return deviceId;
}

export function getKioskToken(): string | null {
  return localStorage.getItem(KIOSK_TOKEN_KEY);
}

export function setKioskToken(token: string) {
  localStorage.setItem(KIOSK_TOKEN_KEY, token);
}

export function removeKioskToken() {
  localStorage.removeItem(KIOSK_TOKEN_KEY);
}
