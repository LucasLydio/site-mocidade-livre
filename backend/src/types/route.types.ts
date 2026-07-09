import type { HttpMethod, HttpRequest, HttpResponse } from "./http.types";

export type RouteHandler = (request: HttpRequest) => Promise<HttpResponse>;

export type RouteDefinition = {
  method: HttpMethod;
  path: string;
  protected?: boolean;
  handler: RouteHandler;
};

export type ResolvedRoute = {
  route: RouteDefinition;
  params: Record<string, string>;
};

