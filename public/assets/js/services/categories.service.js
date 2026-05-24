import { apiFetch } from '../core/api.js';

export async function listCategories({ is_active = true, limit = 100, offset = 0, includeInactive = false } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  if (includeInactive) {
    params.set('includeInactive', 'true');
  } else if (is_active !== undefined) {
    params.set('is_active', String(Boolean(is_active)));
  }

  return apiFetch(`/category?${params.toString()}`);
}

export async function createCategory(payload) {
  return apiFetch('/category', { method: 'POST', body: payload });
}

export async function updateCategory(id, payload) {
  const params = new URLSearchParams({ id });
  return apiFetch(`/category?${params.toString()}`, { method: 'PUT', body: payload });
}

export async function deleteCategory(id) {
  const params = new URLSearchParams({ id });
  return apiFetch(`/category?${params.toString()}`, { method: 'DELETE' });
}

