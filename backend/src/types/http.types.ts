import type { UserRole } from "../modules/users/users.schema";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type HttpRequest = {
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
  rawBody?: Buffer;
  ip: string;
  user?: AuthenticatedUser;
};

export type HttpResponse = {
  statusCode: number;
  headers?: Record<string, string | string[]>;
  body: string;
};

export type NetlifyEvent = {
  httpMethod: string;
  path: string;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
  isBase64Encoded?: boolean;
};
