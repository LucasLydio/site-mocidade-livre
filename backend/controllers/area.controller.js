const areaService = require("../services/area.service");
const { badRequest, sendError, sendSuccess } = require("../utils/response");
const { requireAdmin } = require("../utils/guards");
const { parseJsonBody } = require("./http");

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || "").toLowerCase();
    const query = event.queryStringParameters || {};

    const isImagesRoute = path.endsWith("/areas/images");
    const isBaseRoute = path.endsWith("/areas");

    if (!isImagesRoute && !isBaseRoute) {
      return badRequest("Unsupported route.");
    }

    if (isImagesRoute) {
      if (method !== "POST") return badRequest(`Unsupported method: ${method}`);
      requireAdmin(event);

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const result = await areaService.uploadCoverImage(body);
      return sendSuccess(result, "Cover image uploaded successfully.", 201);
    }

    // Public: GET /areas or GET /areas?slug=...
    if (method === "GET" && String(query.admin || "").toLowerCase() !== "true") {
      const slug = String(query.slug || "").trim();
      if (slug) {
        const area = await areaService.getAreaBySlug(slug);
        return sendSuccess(area, "Area fetched successfully.");
      }

      const areas = await areaService.listActiveAreas();
      return sendSuccess(areas, "Areas fetched successfully.");
    }

    // Admin operations
    requireAdmin(event);

    if (method === "GET") {
      const id = String(query.id || "").trim();
      const search = String(query.search || "").trim();

      if (id) {
        const area = await areaService.getAreaByIdAdmin(id);
        return sendSuccess(area, "Area fetched successfully.");
      }

      const areas = await areaService.listAreasAdmin({ search: search || null });
      return sendSuccess(areas, "Areas fetched successfully.");
    }

    if (method === "POST") {
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const area = await areaService.createArea(body);
      return sendSuccess(area, "Area created successfully.", 201);
    }

    if (method === "PUT") {
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Area id is required in query params.");

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const area = await areaService.updateArea(id, body);
      return sendSuccess(area, "Area updated successfully.");
    }

    if (method === "PATCH") {
      const id = String(query.id || "").trim();
      const action = String(query.action || "").toLowerCase();
      if (!id) return badRequest("Area id is required in query params.");

      if (action === "toggle-active") {
        const body = parseJsonBody(event.body) || {};
        const area = await areaService.toggleAreaActive(id, body.is_active);
        return sendSuccess(area, "Area updated successfully.");
      }

      return badRequest("Unsupported action.");
    }

    if (method === "DELETE") {
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Area id is required in query params.");

      const area = await areaService.deleteArea(id);
      return sendSuccess(area, "Area deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};

