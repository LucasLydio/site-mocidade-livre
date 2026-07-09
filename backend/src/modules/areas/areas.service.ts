import { env } from "../../config/env";
import { cacheNamespaces } from "../../infra/redis/cache.namespaces";
import {
  cacheKey,
  getOrSetCache,
  invalidateCacheNamespace
} from "../../infra/redis/cache.service";
import { paginationMeta } from "../../utils/pagination";
import { areasRepository } from "./areas.repository";
import type { CreateAreaInput, UpdateAreaInput } from "./areas.schema";

export const areasService = {
  async list(page: number, limit: number) {
    return getOrSetCache(
      cacheNamespaces.areas,
      cacheKey("list", page, limit),
      async () => {
        const { data, total } = await areasRepository.list(page, limit);
        return { data, pagination: paginationMeta(page, limit, total) };
      },
      env.CACHE_CONTENT_TTL_SECONDS
    );
  },
  getById(id: string) {
    return getOrSetCache(
      cacheNamespaces.areas,
      cacheKey("detail", id),
      () => areasRepository.findById(id),
      env.CACHE_CONTENT_TTL_SECONDS
    );
  },
  async create(input: CreateAreaInput) {
    const area = await areasRepository.create(input);
    await invalidateCacheNamespace(cacheNamespaces.areas);
    return area;
  },
  async update(id: string, input: UpdateAreaInput) {
    const area = await areasRepository.update(id, input);
    await invalidateCacheNamespace(cacheNamespaces.areas);
    return area;
  },
  async delete(id: string) {
    await areasRepository.delete(id);
    await invalidateCacheNamespace(cacheNamespaces.areas);
  },
};
