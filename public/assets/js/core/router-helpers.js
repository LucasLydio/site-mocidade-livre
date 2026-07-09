export function safeLocalTarget(value, fallback = 'index.html') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  try {
    const target = new URL(raw, window.location.origin);
    if (target.origin !== window.location.origin) return fallback;
    if (!['http:', 'https:'].includes(target.protocol)) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
