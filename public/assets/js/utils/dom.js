export function clearElement(element) {
  element?.replaceChildren();
}

export function setText(element, value) {
  if (element) element.textContent = String(value ?? '');
}

export function safeWebUrl(value, fallback) {
  try {
    const url = new URL(String(value || ''), window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

export function setSafeImage(image, { src, fallback, alt = '' }) {
  if (!image) return;
  image.src = safeWebUrl(src, fallback);
  image.alt = String(alt);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );
}
