import { FUNCTIONS_BASE_URL } from './config.js';
import { getToken } from './session.js';

export async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const token = getToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${FUNCTIONS_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || payload?.success === false) {
    const message = payload?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.statusCode = res.status;
    err.payload = payload;
    throw err;
  }

  return payload?.data ?? payload;
}

