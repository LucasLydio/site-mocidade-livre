import { z } from "zod";
import { publicRegisterSchema } from "../users/users.schema";

export const loginSchema = z.object({
  login: z.string().min(3).max(160).optional(),
  email: z.string().min(3).max(160).optional(),
  password: z.string().min(1).max(100)
}).refine((data) => data.login || data.email, {
  message: "Informe email ou login.",
  path: ["login"]
});

export const registerSchema = publicRegisterSchema;

export const recoverPasswordSchema = z.object({
  email: z.string().email().max(160)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>;
