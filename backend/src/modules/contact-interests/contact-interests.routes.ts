import type { RouteDefinition } from "../../types/route.types";
import { contactInterestsController } from "./contact-interests.controller";

export const contactInterestsRoutes: RouteDefinition[] = [
  { method: "GET", path: "/contact-interests", protected: true, handler: (request) => contactInterestsController.list(request) },
  { method: "POST", path: "/contact-interests", handler: (request) => contactInterestsController.create(request) },
  { method: "GET", path: "/contact-interests/:id", protected: true, handler: (request) => contactInterestsController.get(request) },
  { method: "PATCH", path: "/contact-interests/:id", protected: true, handler: (request) => contactInterestsController.update(request) },
  { method: "PUT", path: "/contact-interests/:id", protected: true, handler: (request) => contactInterestsController.update(request) },
  { method: "DELETE", path: "/contact-interests/:id", protected: true, handler: (request) => contactInterestsController.delete(request) }
];
