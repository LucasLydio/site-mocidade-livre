import { apiClient, buildQuery } from '../core/api.js';

export class EventsService {
  list({ page = 1, limit = 100, search } = {}) {
    return apiClient.get(`/events${buildQuery({ page, limit })}`)
      .then((events) => search
        ? events.filter((event) => `${event.title} ${event.summary || ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
        : events);
  }

  getById(id) {
    return apiClient.get(`/events/${encodeURIComponent(id)}`);
  }

  create(input) {
    return apiClient.post('/events', input);
  }

  update(id, input) {
    return apiClient.patch(`/events/${encodeURIComponent(id)}`, input);
  }

  delete(id) {
    return apiClient.delete(`/events/${encodeURIComponent(id)}`);
  }
}

export const eventsService = new EventsService();
export const listPublishedEvents = (options) => eventsService.list(options);
export const getPublishedEventById = (id) => eventsService.getById(id);
export const listAdminEvents = (options) => eventsService.list(options);
export const getAdminEventById = (id) => eventsService.getById(id);
export const createEvent = (input) => eventsService.create(input);
export const updateEvent = (id, input) => eventsService.update(id, input);
export const toggleEventPublished = (id, isPublished) => eventsService.update(id, { isPublished });
export const deleteEvent = (id) => eventsService.delete(id);
