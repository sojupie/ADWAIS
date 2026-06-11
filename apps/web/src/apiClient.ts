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

export interface MutatorConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: any;
  data?: any;
  headers?: any;
  signal?: AbortSignal;
}

export async function customClient<T>(config: MutatorConfig): Promise<T>;
export async function customClient<T>(url: string, config?: RequestInit): Promise<T>;
export async function customClient<T>(
  first: string | MutatorConfig,
  second?: RequestInit
): Promise<T> {
  if (typeof first === 'string') {
    return apiFetch<T>(first, second);
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

