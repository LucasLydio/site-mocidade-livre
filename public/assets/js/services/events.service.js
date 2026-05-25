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

export async function listPublishedEvents({ limit = 100, offset = 0, search, status = 'all' } = {}) {
  return apiFetch(withQuery('/events', { limit, offset, search, status }));
}

export async function getPublishedEventById(id) {
  return apiFetch(withQuery('/events', { id }));
}

export async function listAdminEvents({ limit = 200, offset = 0, search, status = 'all', is_published } = {}) {
  return apiFetch(withQuery('/events', { admin: true, limit, offset, search, status, is_published }));
}

export async function getAdminEventById(id) {
  return apiFetch(withQuery('/events', { admin: true, id }));
}

export async function createEvent(payload) {
  return apiFetch('/events?admin=true', { method: 'POST', body: payload });
}

export async function updateEvent(id, payload) {
  return apiFetch(withQuery('/events', { admin: true, id }), { method: 'PUT', body: payload });
}

export async function toggleEventPublished(id, is_published) {
  return apiFetch(withQuery('/events', { admin: true, id, action: 'toggle-published' }), { method: 'PATCH', body: { is_published } });
}

export async function deleteEvent(id) {
  return apiFetch(withQuery('/events', { admin: true, id }), { method: 'DELETE' });
}

export async function uploadEventCover({ event_id, file }) {
  const base64 = await readFileAsDataUrl(file);
  return apiFetch('/events/images', {
    method: 'POST',
    body: {
      event_id,
      filename: file.name,
      content_type: file.type,
      file_base64: base64,
    },
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}
