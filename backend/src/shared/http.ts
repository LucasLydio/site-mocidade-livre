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

function rawBodyFromEvent(event: NetlifyEvent): Buffer | undefined {
  if (!event.body) {
    return undefined;
  }

  return Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
}

function parseBody(event: NetlifyEvent, headers: Record<string, string>, rawBody?: Buffer): unknown {
  if (!rawBody) {
    return undefined;
  }

  const contentType = headers["content-type"] ?? "";

  if (contentType && !contentType.includes("application/json") && !contentType.includes("+json")) {
    return undefined;
  }

  const rawText = rawBody.toString("utf8");

  if (!rawText.trim()) {
    return undefined;
  }

  return JSON.parse(rawText);
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
  const rawBody = rawBodyFromEvent(event);

  return {
    method: event.httpMethod.toUpperCase() as HttpMethod,
    path: pathOverride ?? event.path,
    headers,
    query: normalizeQuery(event.queryStringParameters),
    params: {},
    body: parseBody(event, headers, rawBody),
    rawBody,
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
