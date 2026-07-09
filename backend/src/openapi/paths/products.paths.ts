import {
  bearerSecurity,
  crudPaths,
  resourceResponse,
  requestBody
} from "./path-helpers";

export const productsPaths = {
  ...crudPaths("/products", "Products", "Product", "ProductInput"),
  "/products/{productId}/images": {
    parameters: [{ $ref: "#/components/parameters/ProductId" }],
    get: {
      tags: ["Products"],
      operationId: "listProductImages",
      responses: {
        "200": {
          description: "Product images",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["success", "data"],
                properties: {
                  success: { const: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProductImage" }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ["Products"],
      operationId: "createProductImage",
      security: bearerSecurity,
      requestBody: requestBody("ProductImageInput"),
      responses: {
        "201": resourceResponse("ProductImage", "Created product image")
      }
    }
  },
  "/products/{productId}/images/{imageId}": {
    parameters: [
      { $ref: "#/components/parameters/ProductId" },
      { $ref: "#/components/parameters/ImageId" }
    ],
    patch: {
      tags: ["Products"],
      operationId: "updateProductImage",
      security: bearerSecurity,
      requestBody: requestBody("ProductImageInput"),
      responses: {
        "200": resourceResponse("ProductImage", "Updated product image")
      }
    },
    put: {
      tags: ["Products"],
      operationId: "replaceProductImage",
      security: bearerSecurity,
      requestBody: requestBody("ProductImageInput"),
      responses: {
        "200": resourceResponse("ProductImage", "Updated product image")
      }
    },
    delete: {
      tags: ["Products"],
      operationId: "deleteProductImage",
      security: bearerSecurity,
      responses: { "204": { description: "Deleted product image" } }
    }
  }
} as const;
