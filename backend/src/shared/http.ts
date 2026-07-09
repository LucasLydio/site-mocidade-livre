import type { HttpMethod, HttpRequest, NetlifyEvent } from "../types/http.types";

function normalizeHeaders(headers?: Record<string, string | undefined>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value !== undefined) {
      normalized[key.toLowerCase()] = value;
    }
  }

  return normalized;
}

function parseBody(event: NetlifyEvent): unknown {
  if (!event.body) {
    return undefined;
  }

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;

  if (!rawBody.trim()) {
    return undefined;
  }

  return JSON.parse(rawBody);
}

function normalizeQuery(query?: Record<string, string | undefined> | null): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function clientIp(headers: Record<string, string>): string {
  const forwarded = headers["x-forwarded-for"];

  return forwarded?.split(",")[0]?.trim() || headers["client-ip"] || "unknown";
}

export function createHttpRequest(event: NetlifyEvent, pathOverride?: string): HttpRequest {
  const headers = normalizeHeaders(event.headers);

  return {
    method: event.httpMethod.toUpperCase() as HttpMethod,
    path: pathOverride ?? event.path,
    headers,
    query: normalizeQuery(event.queryStringParameters),
    params: {},
    body: parseBody(event),
    ip: clientIp(headers)
  };
}

export function authHeaderToken(headers: Record<string, string>): string | null {
  const header = headers.authorization;

  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return null;
}

export function cookieValue(headers: Record<string, string>, name: string): string | null {
  const cookieHeader = headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function sanitizePath(path: string): string {
  return path
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api/, "")
    .replace(/^\/\.netlify\/functions/, "")
    .replace(/\/$/, "") || "/";
}

