import type { RouteDefinition } from "../../types/route.types";
import { productsController } from "./products.controller";

export const productsRoutes: RouteDefinition[] = [
  { method: "GET", path: "/products", handler: (request) => productsController.list(request) },
  { method: "POST", path: "/products", protected: true, handler: (request) => productsController.create(request) },
  { method: "GET", path: "/products/:id", handler: (request) => productsController.get(request) },
  { method: "PATCH", path: "/products/:id", protected: true, handler: (request) => productsController.update(request) },
  { method: "PUT", path: "/products/:id", protected: true, handler: (request) => productsController.update(request) },
  { method: "DELETE", path: "/products/:id", protected: true, handler: (request) => productsController.delete(request) },
  { method: "GET", path: "/products/:productId/images", handler: (request) => productsController.listImages(request) },
  { method: "POST", path: "/products/:productId/images", protected: true, handler: (request) => productsController.createImage(request) },
  { method: "PATCH", path: "/products/:productId/images/:imageId", protected: true, handler: (request) => productsController.updateImage(request) },
  { method: "PUT", path: "/products/:productId/images/:imageId", protected: true, handler: (request) => productsController.updateImage(request) },
  { method: "DELETE", path: "/products/:productId/images/:imageId", protected: true, handler: (request) => productsController.deleteImage(request) }
];
