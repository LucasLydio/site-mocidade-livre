import type { Prisma } from "@prisma/client";
import { prisma } from "../../infra/prisma/prisma.client";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export const categoriesRepository = {
  async list(page: number, limit: number) {
    const where = { isActive: true };
    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
      prisma.category.count({ where })
    ]);
    return { data, total };
  },
  findById(id: string) {
    return prisma.category.findFirst({ where: { id, isActive: true } });
  },
  create(input: CreateCategoryInput) {
    return prisma.category.create({ data: input as Prisma.CategoryCreateInput });
  },
  update(id: string, input: UpdateCategoryInput) {
    return prisma.category.update({ where: { id }, data: input });
  },
  async delete(id: string) {
    await prisma.category.delete({ where: { id } });
  }
};
