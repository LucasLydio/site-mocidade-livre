import type { RouteDefinition } from "../../types/route.types";
import { cartsController } from "./carts.controller";

export const cartsRoutes: RouteDefinition[] = [
  { method: "GET", path: "/carts", protected: true, handler: (request) => cartsController.list(request) },
  { method: "POST", path: "/carts", protected: true, handler: (request) => cartsController.create(request) },
  { method: "GET", path: "/carts/:id", protected: true, handler: (request) => cartsController.get(request) },
  { method: "PATCH", path: "/carts/:id", protected: true, handler: (request) => cartsController.update(request) },
  { method: "PUT", path: "/carts/:id", protected: true, handler: (request) => cartsController.update(request) },
  { method: "DELETE", path: "/carts/:id", protected: true, handler: (request) => cartsController.delete(request) },
  { method: "POST", path: "/carts/:cartId/items", protected: true, handler: (request) => cartsController.addItem(request) },
  { method: "PATCH", path: "/carts/:cartId/items/:itemId", protected: true, handler: (request) => cartsController.updateItem(request) },
  { method: "PUT", path: "/carts/:cartId/items/:itemId", protected: true, handler: (request) => cartsController.updateItem(request) },
  { method: "DELETE", path: "/carts/:cartId/items/:itemId", protected: true, handler: (request) => cartsController.deleteItem(request) }
];
