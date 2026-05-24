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

export async function createCart() {
  return apiFetch('/cart', { method: 'POST', body: {} });
}

export async function getCart(cartId) {
  return apiFetch(withQuery('/cart', { id: cartId }));
}

export async function addCartItem({ cart_id, product_id, quantity }) {
  return apiFetch('/cart/items', {
    method: 'POST',
    body: { cart_id, product_id, quantity }
  });
}

export async function updateCartItem(id, { quantity }) {
  return apiFetch(withQuery('/cart/items', { id }), {
    method: 'PUT',
    body: { quantity }
  });
}

export async function removeCartItem(id) {
  return apiFetch(withQuery('/cart/items', { id }), { method: 'DELETE' });
}

export async function checkoutWhatsapp(payload) {
  return apiFetch('/cart/checkout-whatsapp', { method: 'POST', body: payload });
}
