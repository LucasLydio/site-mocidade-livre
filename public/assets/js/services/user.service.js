import { apiFetch } from '../core/api.js';

export async function getMe() {
  return apiFetch('/user/me');
}

export async function updateMe({ name, telephone } = {}) {
  return apiFetch('/user/me', {
    method: 'PATCH',
    body: {
      ...(name !== undefined ? { name } : {}),
      ...(telephone !== undefined ? { telephone } : {})
    }
  });
}

