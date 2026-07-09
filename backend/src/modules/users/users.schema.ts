import { z } from "zod";

export const UserRole = {
  admin: "admin",
  common: "common"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const userRoleSchema = z.enum([UserRole.admin, UserRole.common]);

export const idParamSchema = z.object({
  id: z.string().uuid()
});


const createUserBaseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  role: userRoleSchema.default(UserRole.common),
  telephone: z.string().min(8).max(30).optional(),
  password: z.string().min(8).max(100)
});

export const createUserSchema = createUserBaseSchema;

export const publicRegisterSchema = createUserBaseSchema
  .omit({ role: true })
  .extend({ role: z.literal(UserRole.common).default(UserRole.common) });

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().max(160).optional(),
    role: userRoleSchema.optional(),
    telephone: z.string().min(8).max(30).nullable().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).max(100).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
