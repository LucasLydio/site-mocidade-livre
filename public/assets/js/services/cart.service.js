import { apiClient, buildQuery } from '../core/api.js';

export class CartsService {
  list({ status, page = 1, limit = 100 } = {}) {
    return apiClient.get(`/carts${buildQuery({ status, page, limit })}`);
  }

  create(input = {}) {
    return apiClient.post('/carts', input);
  }

  getById(cartId) {
    return apiClient.get(`/carts/${encodeURIComponent(cartId)}`);
  }

  update(cartId, input) {
    return apiClient.patch(`/carts/${encodeURIComponent(cartId)}`, input);
  }

  delete(cartId) {
    return apiClient.delete(`/carts/${encodeURIComponent(cartId)}`);
  }

  addItem(cartId, { productId, quantity }) {
    return apiClient.post(`/carts/${encodeURIComponent(cartId)}/items`, {
      productId,
      quantity
    });
  }

  updateItem(cartId, itemId, { quantity }) {
    return apiClient.patch(
      `/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`,
      { quantity }
    );
  }

  removeItem(cartId, itemId) {
    return apiClient.delete(
      `/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`
    );
  }

  checkout(cartId, input) {
    return this.update(cartId, {
      customerName: input.customerName,
      customerWhatsapp: input.customerWhatsapp,
      notes: input.notes,
      status: 'sent_to_whatsapp'
    });
  }
}

export const cartsService = new CartsService();
export const createCart = (input) => cartsService.create(input);
export const getCart = (cartId) => cartsService.getById(cartId);
export const addCartItem = (cartId, input) => cartsService.addItem(cartId, input);
export const updateCartItem = (cartId, itemId, input) => cartsService.updateItem(cartId, itemId, input);
export const removeCartItem = (cartId, itemId) => cartsService.removeItem(cartId, itemId);
export const checkoutWhatsapp = (cartId, input) => cartsService.checkout(cartId, input);
