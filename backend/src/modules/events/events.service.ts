import { AppError } from "../../shared/errors/app-error";
import { env } from "../../config/env";
import { cacheNamespaces } from "../../infra/redis/cache.namespaces";
import {
  cacheKey,
  getOrSetCache,
  invalidateCacheNamespace
} from "../../infra/redis/cache.service";
import { paginationMeta } from "../../utils/pagination";
import { eventsRepository } from "./events.repository";
import type { CreateEventInput, UpdateEventInput } from "./events.schema";

export const eventsService = {
  async list(page: number, limit: number) {
    return getOrSetCache(
      cacheNamespaces.events,
      cacheKey("list", page, limit),
      async () => {
        const { data, total } = await eventsRepository.list(page, limit);
        return { data, pagination: paginationMeta(page, limit, total) };
      },
      env.CACHE_CONTENT_TTL_SECONDS
    );
  },
  getById(id: string) {
    return getOrSetCache(
      cacheNamespaces.events,
      cacheKey("detail", id),
      () => eventsRepository.findById(id),
      env.CACHE_CONTENT_TTL_SECONDS
    );
  },
  async create(input: CreateEventInput, createdBy: string) {
    const event = await eventsRepository.create(input, createdBy);
    await invalidateCacheNamespace(cacheNamespaces.events);
    return event;
  },
  async update(id: string, input: UpdateEventInput) {
    if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
      throw new AppError(400, "A data final deve ser posterior a data inicial.");
    }
    const event = await eventsRepository.update(id, input);
    await invalidateCacheNamespace(cacheNamespaces.events);
    return event;
  },
  async delete(id: string) {
    await eventsRepository.delete(id);
    await invalidateCacheNamespace(cacheNamespaces.events);
  },
};
