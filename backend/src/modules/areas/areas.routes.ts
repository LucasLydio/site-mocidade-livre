import type { RouteDefinition } from "../../types/route.types";
import { areasController } from "./areas.controller";

export const areasRoutes: RouteDefinition[] = [
  { method: "GET", path: "/areas", handler: (request) => areasController.list(request) },
  { method: "POST", path: "/areas", protected: true, handler: (request) => areasController.create(request) },
  { method: "GET", path: "/areas/:id", handler: (request) => areasController.get(request) },
  { method: "PATCH", path: "/areas/:id", protected: true, handler: (request) => areasController.update(request) },
  { method: "PUT", path: "/areas/:id", protected: true, handler: (request) => areasController.update(request) },
  { method: "DELETE", path: "/areas/:id", protected: true, handler: (request) => areasController.delete(request) }
];
