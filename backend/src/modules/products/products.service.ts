import { env } from "../../config/env";
import { cacheNamespaces } from "../../infra/redis/cache.namespaces";
import {
  cacheKey,
  getOrSetCache,
  invalidateCacheNamespace
} from "../../infra/redis/cache.service";
import { paginationMeta } from "../../utils/pagination";
import { productsRepository } from "./products.repository";
import type { CreateProductImageInput, CreateProductInput, UpdateProductImageInput, UpdateProductInput } from "./products.schema";

export const productsService = {
  async list(page: number, limit: number, categoryId?: string) {
    return getOrSetCache(
      cacheNamespaces.products,
      cacheKey("list", page, limit, categoryId),
      async () => {
        const { data, total } = await productsRepository.list(page, limit, categoryId);
        return { data, pagination: paginationMeta(page, limit, total) };
      },
      env.CACHE_CATALOG_TTL_SECONDS
    );
  },
  getById(id: string) {
    return getOrSetCache(
      cacheNamespaces.products,
      cacheKey("detail", id),
      () => productsRepository.findById(id),
      env.CACHE_CATALOG_TTL_SECONDS
    );
  },
  async create(input: CreateProductInput) {
    const product = await productsRepository.create(input);
    await invalidateCacheNamespace(cacheNamespaces.products);
    return product;
  },
  async update(id: string, input: UpdateProductInput) {
    const product = await productsRepository.update(id, input);
    await invalidateCacheNamespace(cacheNamespaces.products);
    return product;
  },
  async delete(id: string) {
    await productsRepository.delete(id);
    await invalidateCacheNamespace(cacheNamespaces.products);
  },
  listImages(productId: string) {
    return getOrSetCache(
      cacheNamespaces.products,
      cacheKey("images", productId),
      () => productsRepository.listImages(productId),
      env.CACHE_CATALOG_TTL_SECONDS
    );
  },
  async createImage(productId: string, input: CreateProductImageInput) {
    const image = await productsRepository.createImage(productId, input);
    await invalidateCacheNamespace(cacheNamespaces.products);
    return image;
  },
  async updateImage(productId: string, imageId: string, input: UpdateProductImageInput) {
    const image = await productsRepository.updateImage(productId, imageId, input);
    if (image) {
      await invalidateCacheNamespace(cacheNamespaces.products);
    }
    return image;
  },
  async deleteImage(productId: string, imageId: string) {
    const deleted = await productsRepository.deleteImage(productId, imageId);
    if (deleted) {
      await invalidateCacheNamespace(cacheNamespaces.products);
    }
    return deleted;
  },
};
