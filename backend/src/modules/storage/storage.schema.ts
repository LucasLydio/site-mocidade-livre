import { z } from "zod";

export const allowedImageMimeTypes = ["image/webp", "image/png", "image/jpeg"] as const;
export const allowedImageExtensions = ["webp", "png", "jpg", "jpeg"] as const;
export const maxUploadImageBytes = 5 * 1024 * 1024;

export const uploadFolderSchema = z.enum(["areas", "events", "products", "general"]).default("general");

export const deleteStorageFilesSchema = z.object({
  paths: z.array(z.string().min(1).max(1000)).min(1).max(100)
});

export type UploadFolder = z.infer<typeof uploadFolderSchema>;
export type AllowedImageMimeType = (typeof allowedImageMimeTypes)[number];
export type DeleteStorageFilesInput = z.infer<typeof deleteStorageFilesSchema>;
