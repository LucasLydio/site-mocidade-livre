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
    currentPassword: z.string().min(1).max(100).optional(),
    password: z.string().min(8).max(100).optional()
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.email !== undefined ||
      value.role !== undefined ||
      value.telephone !== undefined ||
      value.isActive !== undefined ||
      value.password !== undefined,
    "Informe ao menos um campo."
  )
  .refine((value) => !value.currentPassword || value.password, {
    message: "Informe a nova senha.",
    path: ["password"]
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
