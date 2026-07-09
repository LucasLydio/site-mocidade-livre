import { getJson, remove, setJson } from './storage.js';

const TOKEN_KEY = 'mocidade_token';
const USER_KEY = 'mocidade_user';

export function setSession({ token, user }) {
  // Authentication is maintained by the backend's HttpOnly cookie.
  remove(TOKEN_KEY);

  if (user !== undefined) {
    if (user === null) {
      remove(USER_KEY);
    } else {
      setJson(USER_KEY, user);
    }
  }
}

export function clearSession() {
  remove(TOKEN_KEY);
  remove(USER_KEY);
}

export function getToken() {
  return null;
}

export function getUser() {
  return getJson(USER_KEY, null);
}

export function isAuthenticated() {
  return Boolean(getUser());
}

export function requireAuthRedirect({ redirectTo = 'login.html', next } = {}) {
  if (isAuthenticated()) return true;

  const nextTarget = next || (window.location.pathname.split('/').pop() || 'profile.html');
  const url = new URL(redirectTo, window.location.href);
  url.searchParams.set('next', nextTarget);
  window.location.href = url.toString();
  return false;
}
