import { apiFetch } from '../core/api.js';

function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function createContactInterest(payload) {
  return apiFetch('/contact/interests', { method: 'POST', body: payload });
}

export async function listContactInterests({ status = 'all', search, limit = 50, offset = 0 } = {}) {
  return apiFetch(withQuery('/contact/admin/interests', { status, search, limit, offset }));
}

export async function getContactInterestById(id) {
  return apiFetch(`/contact/admin/interests/${encodeURIComponent(id)}`);
}

export async function updateContactInterestStatus(id, status) {
  return apiFetch(`/contact/admin/interests/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
}

export async function deleteContactInterest(id) {
  return apiFetch(`/contact/admin/interests/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
