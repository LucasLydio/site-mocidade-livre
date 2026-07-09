import type { HttpRequest } from "./types/http.types";
import type { ResolvedRoute, RouteDefinition } from "./types/route.types";
import { jsonResponse, successResponse } from "./utils/response";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { areasRoutes } from "./modules/areas/areas.routes";
import { cartsRoutes } from "./modules/carts/carts.routes";
import { categoriesRoutes } from "./modules/categories/categories.routes";
import { contactInterestsRoutes } from "./modules/contact-interests/contact-interests.routes";
import { eventsRoutes } from "./modules/events/events.routes";
import { productsRoutes } from "./modules/products/products.routes";
import { openApiDocument } from "./openapi";

const openApiRoute: RouteDefinition = {
  method: "GET",
  path: "/openapi.json",
  handler: async () => jsonResponse(openApiDocument)
};

const healthRoute: RouteDefinition = {
  method: "GET",
  path: "/health",
  handler: async () => successResponse({ status: "ok", service: "ml-api-ok" })
};

export const routes: RouteDefinition[] = [
  openApiRoute,
  healthRoute,
  ...authRoutes,
  ...usersRoutes,
  ...areasRoutes,
  ...eventsRoutes,
  ...contactInterestsRoutes,
  ...categoriesRoutes,
  ...productsRoutes,
  ...cartsRoutes
];

function matchPath(pattern: string, path: string): { matched: boolean; params: Record<string, string> } {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = pathPart;
      continue;
    }

    if (patternPart !== pathPart) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

export function resolveRoute(request: HttpRequest): ResolvedRoute | null {
  for (const route of routes) {
    if (route.method !== request.method) {
      continue;
    }

    const result = matchPath(route.path, request.path);

    if (result.matched) {
      return {
        route,
        params: result.params
      };
    }
  }

  return null;
}
