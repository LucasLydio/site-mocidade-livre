import { apiClient, buildQuery } from '../core/api.js';

export class AreasService {
  list({ page = 1, limit = 100, search } = {}) {
    return apiClient.get(`/areas${buildQuery({ page, limit })}`)
      .then((areas) => search
        ? areas.filter((area) => `${area.name} ${area.slug}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
        : areas);
  }

  getById(id) {
    return apiClient.get(`/areas/${encodeURIComponent(id)}`);
  }

  async getBySlug(slug) {
    const areas = await this.list();
    return areas.find((area) => area.slug === slug) || null;
  }

  create(input) {
    return apiClient.post('/areas', input);
  }

  update(id, input) {
    return apiClient.patch(`/areas/${encodeURIComponent(id)}`, input);
  }

  delete(id) {
    return apiClient.delete(`/areas/${encodeURIComponent(id)}`);
  }
}

export const areasService = new AreasService();
export const getActiveAreas = () => areasService.list();
export const getAreaBySlug = (slug) => areasService.getBySlug(slug);
export const getAdminAreas = ({ search } = {}) => areasService.list({ search });
export const getAdminAreaById = (id) => areasService.getById(id);
export const createArea = (input) => areasService.create(input);
export const updateArea = (id, input) => areasService.update(id, input);
export const toggleAreaActive = (id, isActive) => areasService.update(id, { isActive });
export const deleteArea = (id) => areasService.delete(id);
