import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { idParamSchema } from "../users/users.schema";

const areaFields = {
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).nullable().optional(),
  coverImageUrl: z.string().url().max(2048).nullable().optional(),
  isActive: z.boolean().optional()
};

export const areaIdParamSchema = idParamSchema;
export const listAreasSchema = paginationSchema;
export const createAreaSchema = z.object(areaFields);
export const updateAreaSchema = z.object(areaFields).partial().refine((value) => Object.keys(value).length > 0);

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
