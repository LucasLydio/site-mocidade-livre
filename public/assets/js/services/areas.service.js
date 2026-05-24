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

export async function getActiveAreas() {
  return apiFetch('/areas');
}

export async function getAreaBySlug(slug) {
  return apiFetch(withQuery('/areas', { slug }));
}

export async function getAdminAreas({ search } = {}) {
  return apiFetch(withQuery('/areas', { admin: true, search }));
}

export async function getAdminAreaById(id) {
  return apiFetch(withQuery('/areas', { admin: true, id }));
}

export async function createArea(payload) {
  return apiFetch('/areas?admin=true', { method: 'POST', body: payload });
}

export async function updateArea(id, payload) {
  return apiFetch(withQuery('/areas', { admin: true, id }), { method: 'PUT', body: payload });
}

export async function toggleAreaActive(id, is_active) {
  return apiFetch(withQuery('/areas', { admin: true, id, action: 'toggle-active' }), { method: 'PATCH', body: { is_active } });
}

export async function deleteArea(id) {
  return apiFetch(withQuery('/areas', { admin: true, id }), { method: 'DELETE' });
}

export async function uploadAreaCover({ area_id, slug, file }) {
  const base64 = await readFileAsDataUrl(file);
  return apiFetch('/areas/images', {
    method: 'POST',
    body: {
      area_id,
      slug,
      filename: file.name,
      content_type: file.type,
      file_base64: base64
    }
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

