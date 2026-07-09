import { z } from "zod";

export const allowedImageMimeTypes = ["image/webp", "image/png", "image/jpeg"] as const;
export const allowedImageExtensions = ["webp", "png", "jpg", "jpeg"] as const;
export const maxUploadImageBytes = 5 * 1024 * 1024;

export const uploadFolderSchema = z.enum(["areas", "events", "products", "general"]).default("general");

export type UploadFolder = z.infer<typeof uploadFolderSchema>;
export type AllowedImageMimeType = (typeof allowedImageMimeTypes)[number];
