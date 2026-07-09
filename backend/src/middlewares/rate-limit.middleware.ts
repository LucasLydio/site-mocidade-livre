import { env } from "../config/env";
import { redis } from "../infra/redis/redis.client";
import { AppError } from "../shared/errors/app-error";
import type { HttpRequest } from "../types/http.types";

export async function rateLimit(request: HttpRequest, scope = "api"): Promise<void> {
  if (!redis) {
    return;
  }

  const key = `rate-limit:${scope}:${request.ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, env.RATE_LIMIT_WINDOW_SECONDS);
  }

  if (count > env.RATE_LIMIT_MAX_REQUESTS) {
    throw new AppError(429, "Muitas tentativas. Tente novamente em alguns minutos.");
  }
}

