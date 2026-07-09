import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  APP_URL: z.string().default("http://localhost:8888"),
  FRONTEND_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  CORS_DEV: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  STORAGE_BUCKET_FILES_UPLOAD: z.string().min(1).default("mocidade_livre"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ISSUER: z.string().default("ml-api"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_AUDIENCE: z.string().default("authenticated"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  CACHE_CONTENT_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  CACHE_CATALOG_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  CACHE_AUTHZ_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  CACHE_KEY_PREFIX: z.string().min(1).default("mocidade-livre:v1"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional()
});

export const env = envSchema.parse(process.env);

export function allowedOrigins(): string[] {
  return [env.APP_URL, env.FRONTEND_URL, env.CORS_ORIGIN, env.CORS_DEV].filter(
    (value): value is string => Boolean(value)
  );
}
