import { allowedOrigins } from "../config/env";
import type { HttpResponse, NetlifyEvent } from "../types/http.types";

type ResponseInit = {
  statusCode?: number;
  headers?: Record<string, string | string[]>;
};

export function jsonResponse(data: unknown, init: ResponseInit = {}): HttpResponse {
  return {
    statusCode: init.statusCode ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    },
    body: JSON.stringify(data)
  };
}

export function successResponse(data: unknown, init: ResponseInit = {}): HttpResponse {
  return jsonResponse({ success: true, data }, init);
}

export function noContentResponse(init: ResponseInit = {}): HttpResponse {
  return {
    statusCode: init.statusCode ?? 204,
    headers: init.headers,
    body: ""
  };
}

export function withCors(response: HttpResponse, event: NetlifyEvent): HttpResponse {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin;
  const origin = requestOrigin && allowedOrigins().includes(requestOrigin) ? requestOrigin : allowedOrigins()[0] ?? "*";

  return {
    ...response,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      Vary: "Origin",
      ...response.headers
    }
  };
}

export function optionsResponse(event: NetlifyEvent): HttpResponse {
  return withCors({ statusCode: 204, headers: {}, body: "" }, event);
}

