import { getJson, getString, remove, setJson, setString } from './storage.js';

const TOKEN_KEY = 'mocidade_token';
const USER_KEY = 'mocidade_user';

export function setSession({ token, user }) {
  if (token !== undefined) {
    if (token === null || token === '') {
      remove(TOKEN_KEY);
    } else {
      setString(TOKEN_KEY, token);
    }
  }

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
  return getString(TOKEN_KEY, null);
}

export function getUser() {
  return getJson(USER_KEY, null);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function requireAuthRedirect({ redirectTo = 'login.html', next } = {}) {
  if (isAuthenticated()) return true;

  const nextTarget = next || (window.location.pathname.split('/').pop() || 'profile.html');
  const url = new URL(redirectTo, window.location.href);
  url.searchParams.set('next', nextTarget);
  window.location.href = url.toString();
  return false;
}
