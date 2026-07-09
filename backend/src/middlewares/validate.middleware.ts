import type { z, ZodTypeAny } from "zod";

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema, body: unknown): z.infer<TSchema> {
  return schema.parse(body);
}

export function validateQuery<TSchema extends ZodTypeAny>(schema: TSchema, query: unknown): z.infer<TSchema> {
  return schema.parse(query);
}

export function validateParams<TSchema extends ZodTypeAny>(schema: TSchema, params: unknown): z.infer<TSchema> {
  return schema.parse(params);
}
