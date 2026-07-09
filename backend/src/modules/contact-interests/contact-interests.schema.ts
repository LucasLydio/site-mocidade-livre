import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { idParamSchema } from "../users/users.schema";

export const ContactInterestStatus = {
  new: "new",
  contacted: "contacted",
  archived: "archived"
} as const;

export type ContactInterestStatus =
  (typeof ContactInterestStatus)[keyof typeof ContactInterestStatus];

export const contactInterestStatusSchema = z.enum([
  ContactInterestStatus.new,
  ContactInterestStatus.contacted,
  ContactInterestStatus.archived
]);

export const contactInterestIdParamSchema = idParamSchema;
export const listContactInterestsSchema = paginationSchema.extend({
  status: contactInterestStatusSchema.optional()
});
export const createContactInterestSchema = z.object({
  name: z.string().min(2).max(120),
  whatsapp: z.string().min(8).max(30),
  email: z.string().email().max(160).nullable().optional(),
  areaInterest: z.string().min(2).max(120),
  message: z.string().max(3000).nullable().optional()
});
export const updateContactInterestSchema = z.object({
  status: contactInterestStatusSchema
});
export type CreateContactInterestInput = z.infer<typeof createContactInterestSchema>;
