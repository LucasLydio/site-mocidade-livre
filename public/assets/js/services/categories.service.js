import { apiClient, buildQuery } from '../core/api.js';

export class CategoriesService {
  list({ page = 1, limit = 100 } = {}) {
    return apiClient.get(`/categories${buildQuery({ page, limit })}`);
  }

  getById(id) {
    return apiClient.get(`/categories/${encodeURIComponent(id)}`);
  }

  create(input) {
    return apiClient.post('/categories', input);
  }

  update(id, input) {
    return apiClient.patch(`/categories/${encodeURIComponent(id)}`, input);
  }

  delete(id) {
    return apiClient.delete(`/categories/${encodeURIComponent(id)}`);
  }
}

export const categoriesService = new CategoriesService();
export const listCategories = (options) => categoriesService.list(options);
export const createCategory = (input) => categoriesService.create(input);
export const updateCategory = (id, input) => categoriesService.update(id, input);
export const deleteCategory = (id) => categoriesService.delete(id);
