import { env } from "../../config/env";
import { cacheNamespaces } from "../../infra/redis/cache.namespaces";
import {
  cacheKey,
  getOrSetCache,
  invalidateCacheNamespace
} from "../../infra/redis/cache.service";
import { paginationMeta } from "../../utils/pagination";
import { categoriesRepository } from "./categories.repository";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export const categoriesService = {
  async list(page: number, limit: number) {
    return getOrSetCache(
      cacheNamespaces.categories,
      cacheKey("list", page, limit),
      async () => {
        const { data, total } = await categoriesRepository.list(page, limit);
        return { data, pagination: paginationMeta(page, limit, total) };
      },
      env.CACHE_CONTENT_TTL_SECONDS
    );
  },
  getById(id: string) {
    return getOrSetCache(
      cacheNamespaces.categories,
      cacheKey("detail", id),
      () => categoriesRepository.findById(id),
      env.CACHE_CONTENT_TTL_SECONDS
    );
  },
  async create(input: CreateCategoryInput) {
    const category = await categoriesRepository.create(input);
    await Promise.all([
      invalidateCacheNamespace(cacheNamespaces.categories),
      invalidateCacheNamespace(cacheNamespaces.products)
    ]);
    return category;
  },
  async update(id: string, input: UpdateCategoryInput) {
    const category = await categoriesRepository.update(id, input);
    await Promise.all([
      invalidateCacheNamespace(cacheNamespaces.categories),
      invalidateCacheNamespace(cacheNamespaces.products)
    ]);
    return category;
  },
  async delete(id: string) {
    await categoriesRepository.delete(id);
    await Promise.all([
      invalidateCacheNamespace(cacheNamespaces.categories),
      invalidateCacheNamespace(cacheNamespaces.products)
    ]);
  },
};
