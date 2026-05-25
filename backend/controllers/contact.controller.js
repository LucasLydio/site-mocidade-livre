const contactService = require("../services/contact.service");
const { badRequest, sendError, sendSuccess } = require("../utils/response");
const { requireAdmin } = require("../utils/guards");
const { parseJsonBody } = require("./http");

function matchPath(path, regex) {
  const m = String(path || "").toLowerCase().match(regex);
  return m || null;
}

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || "");

    const publicInterests = matchPath(path, /\/contact\/interests\/?$/i);
    const adminList = matchPath(path, /\/contact\/admin\/interests\/?$/i);
    const adminById = matchPath(path, /\/contact\/admin\/interests\/([^/]+)\/?$/i);
    const adminStatus = matchPath(path, /\/contact\/admin\/interests\/([^/]+)\/status\/?$/i);

    if (!publicInterests && !adminList && !adminById && !adminStatus) {
      return badRequest("Unsupported route.");
    }

    if (publicInterests) {
      if (method !== "POST") return badRequest(`Unsupported method: ${method}`);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const created = await contactService.createInterest(body);
      return sendSuccess(created, "Interest sent successfully.", 201);
    }

    // Admin operations
    requireAdmin(event);

    if (adminList) {
      if (method !== "GET") return badRequest(`Unsupported method: ${method}`);
      const query = event.queryStringParameters || {};
      const result = await contactService.listInterestsAdmin(query);
      return sendSuccess(result, "Contact interests fetched successfully.");
    }

    if (adminStatus) {
      if (method !== "PATCH") return badRequest(`Unsupported method: ${method}`);
      const id = String(adminStatus[1] || "").trim();
      const body = parseJsonBody(event.body) || {};
      const status = body.status;
      const updated = await contactService.updateInterestStatusAdmin(id, status);
      return sendSuccess(updated, "Status updated successfully.");
    }

    if (adminById) {
      const id = String(adminById[1] || "").trim();

      if (method === "GET") {
        const item = await contactService.getInterestByIdAdmin(id);
        return sendSuccess(item, "Contact interest fetched successfully.");
      }

      if (method === "DELETE") {
        const item = await contactService.deleteInterestAdmin(id);
        return sendSuccess(item, "Contact interest deleted successfully.");
      }

      return badRequest(`Unsupported method: ${method}`);
    }

    return badRequest("Unsupported route.");
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};

