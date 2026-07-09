import { prisma } from "../../infra/prisma/prisma.client";
import type { CreateEventInput, UpdateEventInput } from "./events.schema";

const eventInclude = {
  creator: { select: { id: true, name: true } }
};

export const eventsRepository = {
  async list(page: number, limit: number) {
    const where = { isPublished: true };
    const [data, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { startsAt: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.event.count({ where })
    ]);
    return { data, total };
  },
  findById(id: string) {
    return prisma.event.findFirst({ where: { id, isPublished: true }, include: eventInclude });
  },
  create(input: CreateEventInput, createdBy: string) {
    return prisma.event.create({ data: { ...input, createdBy }, include: eventInclude });
  },
  update(id: string, input: UpdateEventInput) {
    return prisma.event.update({ where: { id }, data: input, include: eventInclude });
  },
  async delete(id: string) {
    await prisma.event.delete({ where: { id } });
  }
};
