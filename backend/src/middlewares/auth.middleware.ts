import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../shared/errors/app-error";
import { authHeaderToken, cookieValue } from "../shared/http";
import type { HttpRequest } from "../types/http.types";
import type { JwtPayload } from "../types/auth.types";
import { usersRepository } from "../modules/users/users.repository";

export function signAccessToken(payload: JwtPayload): string {
  const tokenPayload = {
    email: payload.email,
    role: payload.role
  };

  const options: SignOptions = {
    subject: payload.sub,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(tokenPayload, env.JWT_SECRET, {
    ...options
  });
}

export async function authenticate(request: HttpRequest): Promise<HttpRequest> {
  const token = authHeaderToken(request.headers) ?? cookieValue(request.headers, "pg_access_token");

  if (!token) {
    throw new AppError(401, "Voce precisa estar autenticado para continuar.");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    });

    if (typeof decoded === "string" || !decoded.sub) {
      throw new AppError(401, "Token invalido ou expirado.");
    }

    const user = await usersRepository.findPublicById(decoded.sub);

    if (!user || !user.isActive) {
      throw new AppError(401, "Token invalido ou expirado.");
    }

    return {
      ...request,
      user
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Token invalido ou expirado.");
  }
}
