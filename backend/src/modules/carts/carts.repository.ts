import { prisma } from "../../infra/prisma/prisma.client";
import type { CartStatus, CreateCartInput, UpdateCartInput } from "./carts.schema";

const cartInclude = {
  items: { orderBy: { createdAt: "asc" as const } }
};

export const cartsRepository = {
  async list(page: number, limit: number, userId: string | undefined, status?: CartStatus) {
    const where = { ...(userId ? { userId } : {}), ...(status ? { status } : {}) };
    const [data, total] = await prisma.$transaction([
      prisma.cart.findMany({ where, include: cartInclude, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.cart.count({ where })
    ]);
    return { data, total };
  },
  findById(id: string) {
    return prisma.cart.findUnique({ where: { id }, include: cartInclude });
  },
  create(userId: string, input: CreateCartInput) {
    return prisma.cart.create({ data: { ...input, userId }, include: cartInclude });
  },
  update(id: string, input: UpdateCartInput) {
    return prisma.cart.update({ where: { id }, data: input, include: cartInclude });
  },
  async delete(id: string) {
    await prisma.cart.delete({ where: { id } });
  },
  addItem(cartId: string, productId: string, quantity: number) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, isActive: true } });
      if (!product) return { kind: "product-not-found" as const };
      const cart = await tx.cart.findUnique({ where: { id: cartId } });
      if (!cart || cart.status !== "open") return { kind: "cart-not-open" as const };
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId, productId } },
        create: { cartId, productId, quantity, unitPriceCents: product.priceCents, productName: product.name },
        update: { quantity: { increment: quantity }, unitPriceCents: product.priceCents, productName: product.name }
      });
      const updated = await tx.cart.findUnique({ where: { id: cartId }, include: cartInclude });
      return { kind: "ok" as const, cart: updated! };
    });
  },
  async updateItem(cartId: string, itemId: string, quantity: number) {
    const result = await prisma.cartItem.updateMany({ where: { id: itemId, cartId }, data: { quantity } });
    return result.count ? prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude }) : null;
  },
  async deleteItem(cartId: string, itemId: string) {
    const result = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
    return result.count > 0;
  }
};
