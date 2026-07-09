import { apiClient, buildQuery } from '../core/api.js';

export class ContactInterestsService {
  create(input) {
    return apiClient.post('/contact-interests', input);
  }

  list({ status, page = 1, limit = 100 } = {}) {
    return apiClient.get(`/contact-interests${buildQuery({
      page,
      limit,
      status: status === 'all' ? undefined : status
    })}`);
  }

  getById(id) {
    return apiClient.get(`/contact-interests/${encodeURIComponent(id)}`);
  }

  updateStatus(id, status) {
    return apiClient.patch(`/contact-interests/${encodeURIComponent(id)}`, { status });
  }

  delete(id) {
    return apiClient.delete(`/contact-interests/${encodeURIComponent(id)}`);
  }
}

export const contactInterestsService = new ContactInterestsService();
export const createContactInterest = (input) => contactInterestsService.create(input);
export const listContactInterests = (options) => contactInterestsService.list(options);
export const getContactInterestById = (id) => contactInterestsService.getById(id);
export const updateContactInterestStatus = (id, status) => contactInterestsService.updateStatus(id, status);
export const deleteContactInterest = (id) => contactInterestsService.delete(id);
