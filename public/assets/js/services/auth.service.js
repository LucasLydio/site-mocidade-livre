import { apiFetch } from '../core/api.js';
import { clearSession, getToken, setSession } from '../core/session.js';

export async function login({ email, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: {
      email,
      password
    }
  });

  setSession({
    token: data.token,
    user: data.user
  });

  return data;
}

export async function register({ name, email, telephone, password }) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: {
      name,
      email,
      telephone,
      password
    }
  });

  setSession({
    token: data.token,
    user: data.user
  });

  return data;
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST', body: {} });
  } catch {
    // ignore
  } finally {
    clearSession();
  }
}

export async function getSession() {
  const user = await apiFetch('/session/me');
  setSession({
    token: getToken(),
    user
  });

  return user;
}
