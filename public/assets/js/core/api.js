import { API_BASE_URL } from './config.js';

export class ApiError extends Error {
  constructor(message, { status = 0, payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusCode = status;
    this.payload = payload;
  }
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async request(path, { method = 'GET', body, headers = {}, signal } = {}) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const requestHeaders = {
      Accept: 'application/json',
      ...headers
    };

    if (body !== undefined && !isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        credentials: 'same-origin',
        signal,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new ApiError('Não foi possível conectar ao servidor.');
    }

    const payload = response.status === 204
      ? null
      : await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      throw new ApiError(payload?.message || `Falha na requisição (${response.status}).`, {
        status: response.status,
        payload
      });
    }

    return payload?.data ?? payload;
  }

  get(path, options) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  put(path, body, options) {
    return this.request(path, { ...options, method: 'PUT', body });
  }

  patch(path, body, options) {
    return this.request(path, { ...options, method: 'PATCH', body });
  }

  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export function apiFetch(path, options) {
  return apiClient.request(path, options);
}
