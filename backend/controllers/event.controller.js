const eventService = require("../services/event.service");
const { badRequest, sendError, sendSuccess } = require("../utils/response");
const { requireAdmin } = require("../utils/guards");
const { parseJsonBody } = require("./http");

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || "").toLowerCase();
    const query = event.queryStringParameters || {};

    const isImagesRoute = path.endsWith("/events/images");
    const isBaseRoute = path.endsWith("/events");

    if (!isImagesRoute && !isBaseRoute) {
      return badRequest("Unsupported route.");
    }

    if (isImagesRoute) {
      if (method !== "POST") return badRequest(`Unsupported method: ${method}`);
      requireAdmin(event);

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const result = await eventService.uploadCoverImage(body);
      return sendSuccess(result, "Cover image uploaded successfully.", 201);
    }

    const isAdminRequest = String(query.admin || "").toLowerCase() === "true";

    // Public: GET /events or GET /events?id=...
    if (method === "GET" && !isAdminRequest) {
      const id = String(query.id || "").trim();
      if (id) {
        const item = await eventService.getPublishedEventById(id);
        return sendSuccess(item, "Event fetched successfully.");
      }

      const result = await eventService.listPublishedEvents(query);
      return sendSuccess(result, "Events fetched successfully.");
    }

    // Admin operations
    const auth = requireAdmin(event);

    if (method === "GET") {
      const id = String(query.id || "").trim();
      if (id) {
        const item = await eventService.getAdminEventById(id);
        return sendSuccess(item, "Event fetched successfully.");
      }

      const result = await eventService.listAdminEvents(query);
      return sendSuccess(result, "Events fetched successfully.");
    }

    if (method === "POST") {
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const created = await eventService.createEvent(body, { createdBy: auth.userId });
      return sendSuccess(created, "Event created successfully.", 201);
    }

    if (method === "PUT") {
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Event id is required in query params.");

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const updated = await eventService.updateEvent(id, body);
      return sendSuccess(updated, "Event updated successfully.");
    }

    if (method === "PATCH") {
      const id = String(query.id || "").trim();
      const action = String(query.action || "").toLowerCase();
      if (!id) return badRequest("Event id is required in query params.");

      if (action === "toggle-published") {
        const body = parseJsonBody(event.body) || {};
        const updated = await eventService.toggleEventPublished(id, body);
        return sendSuccess(updated, "Event updated successfully.");
      }

      return badRequest("Unsupported action.");
    }

    if (method === "DELETE") {
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Event id is required in query params.");

      const deleted = await eventService.deleteEvent(id);
      return sendSuccess(deleted, "Event deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};
