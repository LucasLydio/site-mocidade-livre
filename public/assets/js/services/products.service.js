import { apiClient, buildQuery } from '../core/api.js';

export class ProductsService {
  list({ categoryId, page = 1, limit = 100 } = {}) {
    return apiClient.get(`/products${buildQuery({ categoryId, page, limit })}`);
  }

  getById(id) {
    return apiClient.get(`/products/${encodeURIComponent(id)}`);
  }

  async getBySlug(slug) {
    const products = await this.list();
    return products.find((product) => product.slug === slug) || null;
  }

  create(input) {
    return apiClient.post('/products', input);
  }

  update(id, input) {
    return apiClient.patch(`/products/${encodeURIComponent(id)}`, input);
  }

  delete(id) {
    return apiClient.delete(`/products/${encodeURIComponent(id)}`);
  }

  listImages(productId) {
    return apiClient.get(`/products/${encodeURIComponent(productId)}/images`);
  }

  createImage(productId, input) {
    return apiClient.post(`/products/${encodeURIComponent(productId)}/images`, input);
  }

  updateImage(productId, imageId, input) {
    return apiClient.patch(
      `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
      input
    );
  }

  deleteImage(productId, imageId) {
    return apiClient.delete(
      `/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`
    );
  }

}

export const productsService = new ProductsService();
export const listProducts = (options) => productsService.list(options);
export const getProductById = (id) => productsService.getById(id);
export const getProductBySlug = (slug) => productsService.getBySlug(slug);
export const createProduct = (input) => productsService.create(input);
export const updateProduct = (id, input) => productsService.update(id, input);
export const deleteProduct = (id) => productsService.delete(id);
export const createProductImage = (productId, input) =>
  productsService.createImage(productId, input);
export const updateProductImage = (productId, imageId, input) =>
  productsService.updateImage(productId, imageId, input);
export const deleteProductImage = (productId, imageId) =>
  productsService.deleteImage(productId, imageId);
