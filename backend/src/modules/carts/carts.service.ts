import type { AuthenticatedUser } from "../../types/http.types";
import { AppError } from "../../shared/errors/app-error";
import { paginationMeta } from "../../utils/pagination";
import { cartsRepository } from "./carts.repository";
import type { CartStatus, CreateCartInput, UpdateCartInput } from "./carts.schema";

async function accessibleCart(id: string, user: AuthenticatedUser) {
  const cart = await cartsRepository.findById(id);
  if (!cart) throw new AppError(404, "Carrinho nao encontrado.");
  if (user.role !== "admin" && cart.userId !== user.id) {
    throw new AppError(403, "Voce nao possui acesso a este carrinho.");
  }
  return cart;
}

export const cartsService = {
  async list(page: number, limit: number, user: AuthenticatedUser, status?: CartStatus) {
    const { data, total } = await cartsRepository.list(page, limit, user.role === "admin" ? undefined : user.id, status);
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  getById: (id: string, user: AuthenticatedUser) => accessibleCart(id, user),
  create: (userId: string, input: CreateCartInput) => cartsRepository.create(userId, input),
  async update(id: string, input: UpdateCartInput, user: AuthenticatedUser) {
    await accessibleCart(id, user);
    return cartsRepository.update(id, input);
  },
  async delete(id: string, user: AuthenticatedUser) {
    await accessibleCart(id, user);
    return cartsRepository.delete(id);
  },
  async addItem(cartId: string, productId: string, quantity: number, user: AuthenticatedUser) {
    await accessibleCart(cartId, user);
    const result = await cartsRepository.addItem(cartId, productId, quantity);
    if (result.kind === "product-not-found") throw new AppError(404, "Produto nao encontrado.");
    if (result.kind === "cart-not-open") throw new AppError(409, "O carrinho nao esta aberto.");
    return result.cart;
  },
  async updateItem(cartId: string, itemId: string, quantity: number, user: AuthenticatedUser) {
    const cart = await accessibleCart(cartId, user);
    if (cart.status !== "open") throw new AppError(409, "O carrinho nao esta aberto.");
    const updated = await cartsRepository.updateItem(cartId, itemId, quantity);
    if (!updated) throw new AppError(404, "Item do carrinho nao encontrado.");
    return updated;
  },
  async deleteItem(cartId: string, itemId: string, user: AuthenticatedUser) {
    const cart = await accessibleCart(cartId, user);
    if (cart.status !== "open") throw new AppError(409, "O carrinho nao esta aberto.");
    if (!(await cartsRepository.deleteItem(cartId, itemId))) throw new AppError(404, "Item do carrinho nao encontrado.");
  }
};
