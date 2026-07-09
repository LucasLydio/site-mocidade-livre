import type { RouteDefinition } from "../../types/route.types";
import { categoriesController } from "./categories.controller";

export const categoriesRoutes: RouteDefinition[] = [
  { method: "GET", path: "/categories", handler: (request) => categoriesController.list(request) },
  { method: "POST", path: "/categories", protected: true, handler: (request) => categoriesController.create(request) },
  { method: "GET", path: "/categories/:id", handler: (request) => categoriesController.get(request) },
  { method: "PATCH", path: "/categories/:id", protected: true, handler: (request) => categoriesController.update(request) },
  { method: "PUT", path: "/categories/:id", protected: true, handler: (request) => categoriesController.update(request) },
  { method: "DELETE", path: "/categories/:id", protected: true, handler: (request) => categoriesController.delete(request) }
];
