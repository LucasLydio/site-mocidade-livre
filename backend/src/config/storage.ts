import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const storageBucketName = env.STORAGE_BUCKET_FILES_UPLOAD;

export const supabaseStorageClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  }
);

export const productImagesBucket = supabaseStorageClient.storage.from(storageBucketName);

export type StorageFileBody =
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | Buffer
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>
  | string;

export type UploadStorageFileInput = {
  path: string;
  body: StorageFileBody;
  contentType: string;
  cacheControl?: string;
  upsert?: boolean;
};

function normalizeStoragePath(path: string): string {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  const segments = normalized.split("/");

  if (!normalized || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Invalid Supabase Storage path.");
  }

  return normalized;
}

function storageError(action: string, message: string): Error {
  return new Error(`Supabase Storage could not ${action}: ${message}`);
}

export function getStoragePublicUrl(path: string): string {
  const normalizedPath = normalizeStoragePath(path);
  const { data } = productImagesBucket.getPublicUrl(normalizedPath);

  return data.publicUrl;
}

export async function createStorageSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const normalizedPath = normalizeStoragePath(path);
  const { data, error } = await productImagesBucket.createSignedUrl(
    normalizedPath,
    expiresInSeconds
  );

  if (error) {
    throw storageError("create a signed URL", error.message);
  }

  return data.signedUrl;
}

export async function uploadStorageFile(
  input: UploadStorageFileInput
): Promise<{ path: string; publicUrl: string }> {
  const path = normalizeStoragePath(input.path);
  const { data, error } = await productImagesBucket.upload(path, input.body, {
    cacheControl: input.cacheControl ?? "3600",
    contentType: input.contentType,
    upsert: input.upsert ?? false
  });

  if (error) {
    throw storageError("upload the file", error.message);
  }

  return {
    path: data.path,
    publicUrl: getStoragePublicUrl(data.path)
  };
}

export async function deleteStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const normalizedPaths = paths.map(normalizeStoragePath);
  const { error } = await productImagesBucket.remove(normalizedPaths);

  if (error) {
    throw storageError("delete files", error.message);
  }
}

export async function verifyStorageConnection(): Promise<void> {
  const { data, error } = await supabaseStorageClient.storage.getBucket(storageBucketName);

  if (error) {
    throw storageError(`access bucket "${storageBucketName}"`, error.message);
  }

  if (!data) {
    throw storageError(`access bucket "${storageBucketName}"`, "Bucket was not found.");
  }
}
