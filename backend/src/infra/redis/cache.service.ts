import { env } from "../../config/env";
import { redis } from "./redis.client";

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.warn(`Redis get failed for key ${key}`, error);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.warn(`Redis set failed for key ${key}`, error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    console.warn(`Redis delete failed for key ${key}`, error);
  }
}
