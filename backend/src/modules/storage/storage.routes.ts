import type { RouteDefinition } from "../../types/route.types";
import { storageController } from "./storage.controller";

export const storageRoutes: RouteDefinition[] = [
  { method: "POST", path: "/storage/images", protected: true, handler: (request) => storageController.uploadImage(request) },
  { method: "GET", path: "/storage/files", protected: true, handler: (request) => storageController.listFiles(request) },
  { method: "DELETE", path: "/storage/files", protected: true, handler: (request) => storageController.deleteFiles(request) }
];
