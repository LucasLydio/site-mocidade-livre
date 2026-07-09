import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { idParamSchema } from "../users/users.schema";

const categoryFields = {
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional()
};

export const categoryIdParamSchema = idParamSchema;
export const listCategoriesSchema = paginationSchema;
export const createCategorySchema = z.object(categoryFields);
export const updateCategorySchema = z.object(categoryFields).partial().refine((value) => Object.keys(value).length > 0);
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
