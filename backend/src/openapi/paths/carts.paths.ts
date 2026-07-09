import {
  bearerSecurity,
  paginationParameters,
  resourceListResponse,
  resourceResponse,
  requestBody
} from "./path-helpers";

const quantityRequestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1 }
        }
      }
    }
  }
} as const;

export const cartsPaths = {
  "/carts": {
    get: {
      tags: ["Carts"],
      operationId: "listCarts",
      security: bearerSecurity,
      parameters: [
        ...paginationParameters,
        {
          name: "status",
          in: "query",
          schema: { $ref: "#/components/schemas/CartStatus" }
        }
      ],
      responses: { "200": resourceListResponse("Cart") }
    },
    post: {
      tags: ["Carts"],
      operationId: "createCart",
      security: bearerSecurity,
      requestBody: requestBody("CartInput"),
      responses: { "201": resourceResponse("Cart", "Created cart") }
    }
  },
  "/carts/{id}": {
    parameters: [{ $ref: "#/components/parameters/Id" }],
    get: {
      tags: ["Carts"],
      operationId: "getCart",
      security: bearerSecurity,
      responses: { "200": resourceResponse("Cart", "Cart by id") }
    },
    patch: {
      tags: ["Carts"],
      operationId: "updateCart",
      security: bearerSecurity,
      requestBody: requestBody("CartInput"),
      responses: { "200": resourceResponse("Cart", "Updated cart") }
    },
    put: {
      tags: ["Carts"],
      operationId: "replaceCart",
      security: bearerSecurity,
      requestBody: requestBody("CartInput"),
      responses: { "200": resourceResponse("Cart", "Updated cart") }
    },
    delete: {
      tags: ["Carts"],
      operationId: "deleteCart",
      security: bearerSecurity,
      responses: { "204": { description: "Deleted cart" } }
    }
  },
  "/carts/{cartId}/items": {
    parameters: [{ $ref: "#/components/parameters/CartId" }],
    post: {
      tags: ["Carts"],
      operationId: "addCartItem",
      security: bearerSecurity,
      requestBody: requestBody("CartItemInput"),
      responses: { "201": resourceResponse("Cart", "Cart with added item") }
    }
  },
  "/carts/{cartId}/items/{itemId}": {
    parameters: [
      { $ref: "#/components/parameters/CartId" },
      { $ref: "#/components/parameters/ItemId" }
    ],
    patch: {
      tags: ["Carts"],
      operationId: "updateCartItem",
      security: bearerSecurity,
      requestBody: quantityRequestBody,
      responses: { "200": resourceResponse("Cart", "Cart with updated item") }
    },
    put: {
      tags: ["Carts"],
      operationId: "replaceCartItem",
      security: bearerSecurity,
      requestBody: quantityRequestBody,
      responses: { "200": resourceResponse("Cart", "Cart with updated item") }
    },
    delete: {
      tags: ["Carts"],
      operationId: "deleteCartItem",
      security: bearerSecurity,
      responses: { "204": { description: "Deleted cart item" } }
    }
  }
} as const;
