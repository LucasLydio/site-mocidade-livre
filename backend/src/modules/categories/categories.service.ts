import { paginationMeta } from "../../utils/pagination";
import { categoriesRepository } from "./categories.repository";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export const categoriesService = {
  async list(page: number, limit: number) {
    const { data, total } = await categoriesRepository.list(page, limit);
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  getById: (id: string) => categoriesRepository.findById(id),
  create: (input: CreateCategoryInput) => categoriesRepository.create(input),
  update: (id: string, input: UpdateCategoryInput) => categoriesRepository.update(id, input),
  delete: (id: string) => categoriesRepository.delete(id)
};
