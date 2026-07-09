import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { idParamSchema } from "../users/users.schema";

export const CartStatus = {
  open: "open",
  sentToWhatsapp: "sent_to_whatsapp",
  abandoned: "abandoned"
} as const;

export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus];

export const cartStatusSchema = z.enum([
  CartStatus.open,
  CartStatus.sentToWhatsapp,
  CartStatus.abandoned
]);

export const cartIdParamSchema = idParamSchema;
export const cartItemParamsSchema = z.object({ cartId: z.string().uuid(), itemId: z.string().uuid().optional() });
export const listCartsSchema = paginationSchema.extend({ status: cartStatusSchema.optional() });
export const createCartSchema = z.object({
  customerName: z.string().min(2).max(120).nullable().optional(),
  customerWhatsapp: z.string().min(8).max(30).nullable().optional(),
  notes: z.string().max(2000).nullable().optional()
});
export const updateCartSchema = createCartSchema.extend({
  status: cartStatusSchema.optional()
}).partial().refine((value) => Object.keys(value).length > 0);
export const createCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive()
});
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive()
});

export type CreateCartInput = z.infer<typeof createCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
