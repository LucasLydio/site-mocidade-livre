import { prisma } from "../../infra/prisma/prisma.client";
import type {
  ContactInterestStatus,
  CreateContactInterestInput
} from "./contact-interests.schema";

export const contactInterestsRepository = {
  async list(page: number, limit: number, status?: ContactInterestStatus) {
    const where = status ? { status } : {};
    const [data, total] = await prisma.$transaction([
      prisma.contactInterest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.contactInterest.count({ where })
    ]);
    return { data, total };
  },
  findById(id: string) {
    return prisma.contactInterest.findUnique({ where: { id } });
  },
  create(input: CreateContactInterestInput) {
    return prisma.contactInterest.create({ data: input });
  },
  updateStatus(id: string, status: ContactInterestStatus) {
    return prisma.contactInterest.update({ where: { id }, data: { status } });
  },
  async delete(id: string) {
    await prisma.contactInterest.delete({ where: { id } });
  }
};
