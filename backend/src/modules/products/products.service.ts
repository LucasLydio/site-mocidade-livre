import { paginationMeta } from "../../utils/pagination";
import { productsRepository } from "./products.repository";
import type { CreateProductImageInput, CreateProductInput, UpdateProductImageInput, UpdateProductInput } from "./products.schema";

export const productsService = {
  async list(page: number, limit: number, categoryId?: string) {
    const { data, total } = await productsRepository.list(page, limit, categoryId);
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  getById: (id: string) => productsRepository.findById(id),
  create: (input: CreateProductInput) => productsRepository.create(input),
  update: (id: string, input: UpdateProductInput) => productsRepository.update(id, input),
  delete: (id: string) => productsRepository.delete(id),
  listImages: (productId: string) => productsRepository.listImages(productId),
  createImage: (productId: string, input: CreateProductImageInput) => productsRepository.createImage(productId, input),
  updateImage: (productId: string, imageId: string, input: UpdateProductImageInput) => productsRepository.updateImage(productId, imageId, input),
  deleteImage: (productId: string, imageId: string) => productsRepository.deleteImage(productId, imageId)
};
