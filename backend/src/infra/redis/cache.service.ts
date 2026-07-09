import { env } from "../../config/env";
import { redis } from "./redis.client";

const inFlightLoads = new Map<string, Promise<unknown>>();

function namespacedKey(namespace: string, generation: number, key: string): string {
  return `${env.CACHE_KEY_PREFIX}:${namespace}:g${generation}:${key}`;
}

function versionKey(namespace: string): string {
  return `${env.CACHE_KEY_PREFIX}:${namespace}:generation`;
}

function normalizedKeyPart(value: string | number | boolean | null | undefined): string {
  return encodeURIComponent(value === undefined || value === null ? "all" : String(value));
}

export function cacheKey(...parts: Array<string | number | boolean | null | undefined>): string {
  return parts.map(normalizedKeyPart).join(":");
}

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

async function getCacheGeneration(namespace: string): Promise<number | null> {
  if (!redis) {
    return 0;
  }

  try {
    const generation = await redis.get<number | string>(versionKey(namespace));
    const parsed = Number(generation ?? 0);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      console.warn(`Redis generation is invalid for namespace ${namespace}`);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(`Redis generation read failed for namespace ${namespace}`, error);
    return null;
  }
}

export async function invalidateCacheNamespace(namespace: string): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.incr(versionKey(namespace));
  } catch (error) {
    console.warn(`Redis invalidation failed for namespace ${namespace}`, error);
  }
}

export async function getOrSetCache<T>(
  namespace: string,
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS
): Promise<T> {
  if (!redis) {
    return loader();
  }

  const generation = await getCacheGeneration(namespace);
  if (generation === null) {
    return loader();
  }

  const fullKey = namespacedKey(namespace, generation, key);
  const cached = await getCache<T>(fullKey);

  if (cached !== null) {
    return cached;
  }

  const existingLoad = inFlightLoads.get(fullKey) as Promise<T> | undefined;
  if (existingLoad) {
    return existingLoad;
  }

  const load = loader()
    .then(async (value) => {
      if (value !== null && value !== undefined) {
        await setCache(fullKey, value, ttlSeconds);
      }
      return value;
    })
    .finally(() => {
      inFlightLoads.delete(fullKey);
    });

  inFlightLoads.set(fullKey, load);
  return load;
}
