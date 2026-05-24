const cartService = require("../services/cart.service");
const { badRequest, sendError, sendSuccess } = require("../utils/response");
const { requireAuth } = require("../utils/guards");
const { parseJsonBody } = require("./http");

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || "").toLowerCase();
    const query = event.queryStringParameters || {};

    const auth = requireAuth(event);

    if (path.endsWith("/cart")) {
      if (method === "POST") {
        const cart = await cartService.createCart({ userId: auth.userId });
        return sendSuccess(cart, "Cart created successfully.", 201);
      }

      if (method === "GET") {
        const cartId = String(query.id || query.cart_id || "").trim();
        if (!cartId) return badRequest("Cart id is required in query params.");

        const cart = await cartService.getCart({ userId: auth.userId, cartId });
        return sendSuccess(cart, "Cart fetched successfully.");
      }

      return badRequest(`Unsupported method: ${method}`);
    }

    if (path.endsWith("/cart/items")) {
      if (method === "POST") {
        const body = parseJsonBody(event.body);
        if (!body) return badRequest("Invalid JSON body.");

        const item = await cartService.addItem({
          userId: auth.userId,
          cartId: body.cart_id,
          productId: body.product_id,
          quantity: body.quantity,
        });

        return sendSuccess(item, "Item added successfully.", 201);
      }

      if (method === "PUT") {
        const id = String(query.id || "").trim();
        if (!id) return badRequest("Cart item id is required in query params.");

        const body = parseJsonBody(event.body);
        if (!body) return badRequest("Invalid JSON body.");

        const item = await cartService.updateItem({
          userId: auth.userId,
          cartItemId: id,
          quantity: body.quantity,
        });

        return sendSuccess(item, "Item updated successfully.");
      }

      if (method === "DELETE") {
        const id = String(query.id || "").trim();
        if (!id) return badRequest("Cart item id is required in query params.");

        const item = await cartService.removeItem({ userId: auth.userId, cartItemId: id });
        return sendSuccess(item, "Item deleted successfully.");
      }

      return badRequest(`Unsupported method: ${method}`);
    }

    if (path.endsWith("/cart/checkout-whatsapp")) {
      if (method !== "POST") return badRequest(`Unsupported method: ${method}`);

      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const result = await cartService.checkoutWhatsapp({
        userId: auth.userId,
        cartId: body.cart_id,
        customer_name: body.customer_name,
        customer_whatsapp: body.customer_whatsapp,
        notes: body.notes,
      });

      return sendSuccess(result, "Checkout generated successfully.");
    }

    return badRequest("Unsupported route.");
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};

