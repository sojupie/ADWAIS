export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const isBodyRequest = options?.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase());
  const headers = new Headers(options?.headers);
  
  if (isBodyRequest && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    console.error(`API Fetch Error [${response.status}] ${url}:`, errorBody);
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return null as unknown as T;
  }
  return JSON.parse(text);
}
