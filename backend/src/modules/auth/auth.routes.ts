import type { RouteDefinition } from "../../types/route.types";
import { authController } from "./auth.controller";

export const authRoutes: RouteDefinition[] = [
  {
    method: "POST",
    path: "/auth/register",
    handler: (request) => authController.register(request)
  },
  {
    method: "POST",
    path: "/auth/login",
    handler: (request) => authController.login(request)
  },
  {
    method: "POST",
    path: "/auth/recover-password",
    handler: (request) => authController.recoverPassword(request)
  },
  {
    method: "GET",
    path: "/auth/me",
    protected: true,
    handler: (request) => authController.me(request)
  },
  {
    method: "POST",
    path: "/auth/logout",
    handler: () => authController.logout()
  }
];
