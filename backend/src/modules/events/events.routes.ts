import type { RouteDefinition } from "../../types/route.types";
import { eventsController } from "./events.controller";

export const eventsRoutes: RouteDefinition[] = [
  { method: "GET", path: "/events", handler: (request) => eventsController.list(request) },
  { method: "POST", path: "/events", protected: true, handler: (request) => eventsController.create(request) },
  { method: "GET", path: "/events/:id", handler: (request) => eventsController.get(request) },
  { method: "PATCH", path: "/events/:id", protected: true, handler: (request) => eventsController.update(request) },
  { method: "PUT", path: "/events/:id", protected: true, handler: (request) => eventsController.update(request) },
  { method: "DELETE", path: "/events/:id", protected: true, handler: (request) => eventsController.delete(request) }
];
