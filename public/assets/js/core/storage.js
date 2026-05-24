export function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setString(key, value) {
  localStorage.setItem(key, String(value));
}

export function getString(key, fallback = null) {
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : raw;
}

export function remove(key) {
  localStorage.removeItem(key);
}

