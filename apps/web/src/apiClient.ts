export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    console.error(`API Fetch Error [${response.status}] ${url}:`, errorBody);
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  return response.json();
}
