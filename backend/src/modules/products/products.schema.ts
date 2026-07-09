import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { idParamSchema } from "../users/users.schema";

const productFields = {
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(180),
  slug: z.string().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(10000).nullable().optional(),
  priceCents: z.number().int().nonnegative(),
  stockQty: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional()
};

const imageFields = {
  imageUrl: z.string().url().max(2048),
  storagePath: z.string().max(1000).nullable().optional(),
  altText: z.string().max(300).nullable().optional(),
  isCover: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional()
};

export const productIdParamSchema = idParamSchema;
export const productImageParamsSchema = z.object({ productId: z.string().uuid(), imageId: z.string().uuid().optional() });
export const listProductsSchema = paginationSchema.extend({ categoryId: z.string().uuid().optional() });
export const createProductSchema = z.object(productFields);
export const updateProductSchema = z.object(productFields).partial().refine((value) => Object.keys(value).length > 0);
export const createProductImageSchema = z.object(imageFields);
export const updateProductImageSchema = z.object(imageFields).partial().refine((value) => Object.keys(value).length > 0);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;
