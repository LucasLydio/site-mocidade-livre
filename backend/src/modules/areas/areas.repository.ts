import type { Prisma } from "@prisma/client";
import { prisma } from "../../infra/prisma/prisma.client";
import type { CreateAreaInput, UpdateAreaInput } from "./areas.schema";

export const areasRepository = {
  async list(page: number, limit: number) {
    const where = { isActive: true };
    const [data, total] = await prisma.$transaction([
      prisma.area.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
      prisma.area.count({ where })
    ]);
    return { data, total };
  },
  findById(id: string) {
    return prisma.area.findFirst({ where: { id, isActive: true } });
  },
  create(input: CreateAreaInput) {
    return prisma.area.create({ data: input as Prisma.AreaCreateInput });
  },
  update(id: string, input: UpdateAreaInput) {
    return prisma.area.update({ where: { id }, data: input });
  },
  async delete(id: string) {
    await prisma.area.delete({ where: { id } });
  }
};
