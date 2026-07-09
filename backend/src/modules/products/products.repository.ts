import { prisma } from "../../infra/prisma/prisma.client";
import type { CreateProductImageInput, CreateProductInput, UpdateProductImageInput, UpdateProductInput } from "./products.schema";

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } }
};

export const productsRepository = {
  async list(page: number, limit: number, categoryId?: string) {
    const where = { isActive: true, ...(categoryId ? { categoryId } : {}) };
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({ where, include: productInclude, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
      prisma.product.count({ where })
    ]);
    return { data, total };
  },
  findById(id: string) {
    return prisma.product.findFirst({ where: { id, isActive: true }, include: productInclude });
  },
  create(input: CreateProductInput) {
    return prisma.product.create({ data: input, include: productInclude });
  },
  update(id: string, input: UpdateProductInput) {
    return prisma.product.update({ where: { id }, data: input, include: productInclude });
  },
  async delete(id: string) {
    await prisma.product.delete({ where: { id } });
  },
  listImages(productId: string) {
    return prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
  },
  createImage(productId: string, input: CreateProductImageInput) {
    return prisma.$transaction(async (tx) => {
      if (input.isCover) {
        await tx.productImage.updateMany({ where: { productId, isCover: true }, data: { isCover: false } });
      }
      return tx.productImage.create({ data: { ...input, productId } });
    });
  },
  updateImage(productId: string, imageId: string, input: UpdateProductImageInput) {
    return prisma.$transaction(async (tx) => {
      const image = await tx.productImage.findFirst({ where: { id: imageId, productId } });
      if (!image) return null;
      if (input.isCover) {
        await tx.productImage.updateMany({ where: { productId, isCover: true }, data: { isCover: false } });
      }
      return tx.productImage.update({ where: { id: imageId }, data: input });
    });
  },
  async deleteImage(productId: string, imageId: string) {
    const result = await prisma.productImage.deleteMany({ where: { id: imageId, productId } });
    return result.count > 0;
  }
};
