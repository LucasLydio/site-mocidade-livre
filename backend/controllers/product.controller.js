const productService = require("../services/product.service");
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

    const isImagesRoute = path.endsWith("/products/images");
    const isBaseRoute = path.endsWith("/products");

    if (!isImagesRoute && !isBaseRoute) {
      return badRequest("Unsupported route.");
    }

    if (isImagesRoute) {
      if (method === "POST") {
        requireAdmin(event);
        const body = parseJsonBody(event.body);
        if (!body) return badRequest("Invalid JSON body.");

        const image = await productService.uploadProductImage(body);
        return sendSuccess(image, "Image uploaded successfully.", 201);
      }

      if (method === "PUT") {
        requireAdmin(event);
        const id = String(query.id || "").trim();
        if (!id) return badRequest("Image id is required in query params.");

        const body = parseJsonBody(event.body);
        if (!body) return badRequest("Invalid JSON body.");

        const image = await productService.updateProductImage(id, body);
        return sendSuccess(image, "Image updated successfully.");
      }

      if (method === "DELETE") {
        requireAdmin(event);
        const id = String(query.id || "").trim();
        if (!id) return badRequest("Image id is required in query params.");

        const image = await productService.removeProductImage(id);
        return sendSuccess(image, "Image deleted successfully.");
      }

      return badRequest(`Unsupported method: ${method}`);
    }

    if (method === "GET") {
      const id = String(query.id || "").trim();
      const slug = String(query.slug || "").trim();
      const categoryId = String(query.categoryId || "").trim();

      const includeInactive = isAdminFromEvent(event) && String(query.includeInactive || "").toLowerCase() === "true";

      if (id) {
        const product = await productService.getProductById(id, { includeInactive });
        return sendSuccess(product, "Product fetched successfully.");
      }

      if (slug) {
        const product = await productService.getProductBySlug(slug, { includeInactive });
        return sendSuccess(product, "Product fetched successfully.");
      }

      const products = await productService.listProducts({ categoryId: categoryId || null, includeInactive });
      return sendSuccess(products, "Products fetched successfully.");
    }

    if (method === "POST") {
      requireAdmin(event);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const product = await productService.createProduct(body);
      return sendSuccess(product, "Product created successfully.", 201);
    }

    if (method === "PUT") {
      requireAdmin(event);
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Product id is required in query params.");

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const product = await productService.updateProduct(id, body);
      return sendSuccess(product, "Product updated successfully.");
    }

    if (method === "DELETE") {
      requireAdmin(event);
      const id = String(query.id || "").trim();
      if (!id) return badRequest("Product id is required in query params.");

      const product = await productService.removeProduct(id);
      return sendSuccess(product, "Product deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};

