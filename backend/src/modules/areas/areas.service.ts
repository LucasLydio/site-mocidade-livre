import { paginationMeta } from "../../utils/pagination";
import { areasRepository } from "./areas.repository";
import type { CreateAreaInput, UpdateAreaInput } from "./areas.schema";

export const areasService = {
  async list(page: number, limit: number) {
    const { data, total } = await areasRepository.list(page, limit);
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  getById: (id: string) => areasRepository.findById(id),
  create: (input: CreateAreaInput) => areasRepository.create(input),
  update: (id: string, input: UpdateAreaInput) => areasRepository.update(id, input),
  delete: (id: string) => areasRepository.delete(id)
};
