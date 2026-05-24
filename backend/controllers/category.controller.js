const categoryService = require("../services/category.service");
const { badRequest, sendError, sendSuccess } = require("../utils/response");
const { requireAdmin, requireAuth } = require("../utils/guards");
const { parseJsonBody } = require("./http");

function isAdminFromEvent(event) {
  try {
    const auth = requireAuth(event);
    return auth.role === "admin";
  } catch {
    return false;
  }
}

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || "").toLowerCase();
    const query = event.queryStringParameters || {};

    if (!path.endsWith("/category")) {
      return badRequest("Unsupported route.");
    }

    if (method === "GET") {
      const result = await categoryService.listCategories(query, { isAdmin: isAdminFromEvent(event) });
      return sendSuccess(result, "Categories fetched successfully.");
    }

    if (method === "POST") {
      requireAdmin(event);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const category = await categoryService.createCategory(body);
      return sendSuccess(category, "Category created successfully.", 201);
    }

    if (method === "PUT") {
      requireAdmin(event);
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Category id is required in query params.");

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const category = await categoryService.updateCategory(id, body);
      return sendSuccess(category, "Category updated successfully.");
    }

    if (method === "DELETE") {
      requireAdmin(event);
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Category id is required in query params.");

      const category = await categoryService.removeCategory(id);
      return sendSuccess(category, "Category deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};

