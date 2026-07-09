import type { RouteDefinition } from "../../types/route.types";
import { usersController } from "./users.controller";

export const usersRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/users",
    protected: true,
    handler: (request) => usersController.list(request)
  },
  {
    method: "POST",
    path: "/users",
    protected: true,
    handler: (request) => usersController.create(request)
  },
  {
    method: "GET",
    path: "/users/me",
    protected: true,
    handler: (request) => usersController.me(request)
  },
  {
    method: "GET",
    path: "/users/:id",
    protected: true,
    handler: (request) => usersController.get(request)
  },
  {
    method: "PATCH",
    path: "/users/:id",
    protected: true,
    handler: (request) => usersController.update(request)
  },
  {
    method: "PUT",
    path: "/users/:id",
    protected: true,
    handler: (request) => usersController.update(request)
  },
  {
    method: "DELETE",
    path: "/users/:id",
    protected: true,
    handler: (request) => usersController.delete(request)
  }
];

