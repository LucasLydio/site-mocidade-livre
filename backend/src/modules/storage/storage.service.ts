import crypto from "node:crypto";
import { deleteStorageFiles, getStoragePublicUrl, productImagesBucket, storageBucketName, uploadStorageFile } from "../../config/storage";
import { prisma } from "../../infra/prisma/prisma.client";
import { AppError } from "../../shared/errors/app-error";
import {
  allowedImageExtensions,
  allowedImageMimeTypes,
  maxUploadImageBytes,
  type AllowedImageMimeType,
  type UploadFolder
} from "./storage.schema";

type MultipartFile = {
  fieldName: string;
  filename: string;
  contentType: string;
  content: Buffer;
};

type ParsedMultipart = {
  fields: Record<string, string>;
  files: MultipartFile[];
};

type UploadImageInput = {
  folder: UploadFolder;
  file: MultipartFile;
};

type StorageUsage = {
  type: "area" | "event" | "product_image";
  id: string;
  label: string;
};

type StorageFile = {
  path: string;
  name: string;
  folder: string;
  publicUrl: string;
  size: number | null;
  contentType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isUsed: boolean;
  usedBy: StorageUsage[];
};

type BucketListItem = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
    mimeType?: string;
    [key: string]: unknown;
  } | null;
};

const imageExtensions = new Set(["webp", "png", "jpg", "jpeg", "gif", "svg"]);

function parseBoundary(contentType: string): string {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = match?.[1] ?? match?.[2];

  if (!boundary) {
    throw new AppError(400, "Requisicao multipart invalida.");
  }

  return boundary;
}

function parseHeaderAttributes(value: string): Record<string, string> {
  const attrs: Record<string, string> = {};

  for (const part of value.split(";").map((item) => item.trim())) {
    const [key, raw] = part.split("=");
    if (!key || raw === undefined) continue;
    attrs[key.toLowerCase()] = raw.replace(/^"|"$/g, "");
  }

  return attrs;
}

function stripTrailingCrlf(buffer: Buffer): Buffer {
  if (buffer.length >= 2 && buffer[buffer.length - 2] === 13 && buffer[buffer.length - 1] === 10) {
    return buffer.subarray(0, -2);
  }

  return buffer;
}

export function parseMultipartFormData(headers: Record<string, string>, rawBody?: Buffer): ParsedMultipart {
  const contentType = headers["content-type"] ?? "";

  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new AppError(415, "Envie o arquivo usando multipart/form-data.");
  }

  if (!rawBody?.length) {
    throw new AppError(400, "Arquivo nao enviado.");
  }

  const boundary = Buffer.from(`--${parseBoundary(contentType)}`);
  const separator = Buffer.from("\r\n\r\n");
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];

  let cursor = rawBody.indexOf(boundary);

  while (cursor !== -1) {
    let partStart = cursor + boundary.length;

    if (rawBody[partStart] === 45 && rawBody[partStart + 1] === 45) break;
    if (rawBody[partStart] === 13 && rawBody[partStart + 1] === 10) partStart += 2;

    const nextBoundary = rawBody.indexOf(boundary, partStart);
    if (nextBoundary === -1) break;

    const part = stripTrailingCrlf(rawBody.subarray(partStart, nextBoundary));
    const headersEnd = part.indexOf(separator);

    if (headersEnd !== -1) {
      const headerLines = part.subarray(0, headersEnd).toString("utf8").split("\r\n");
      const content = part.subarray(headersEnd + separator.length);
      const partHeaders: Record<string, string> = {};

      for (const line of headerLines) {
        const delimiter = line.indexOf(":");
        if (delimiter === -1) continue;
        partHeaders[line.slice(0, delimiter).trim().toLowerCase()] = line.slice(delimiter + 1).trim();
      }

      const disposition = partHeaders["content-disposition"] ?? "";
      const attrs = parseHeaderAttributes(disposition);
      const name = attrs.name;
      const filename = attrs.filename;

      if (name && filename) {
        files.push({
          fieldName: name,
          filename,
          contentType: partHeaders["content-type"] ?? "application/octet-stream",
          content
        });
      } else if (name) {
        fields[name] = content.toString("utf8");
      }
    }

    cursor = nextBoundary;
  }

  return { fields, files };
}

function extensionFromFilename(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function extensionForMimeType(mimeType: AllowedImageMimeType): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "webp";
}

function assertImageSignature(file: MultipartFile): void {
  const bytes = file.content;

  if (file.contentType === "image/png") {
    const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!isPng) throw new AppError(400, "O arquivo PNG parece invalido.");
  }

  if (file.contentType === "image/jpeg") {
    const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
    if (!isJpeg) throw new AppError(400, "O arquivo JPG/JPEG parece invalido.");
  }

  if (file.contentType === "image/webp") {
    const isWebp = bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    if (!isWebp) throw new AppError(400, "O arquivo WEBP parece invalido.");
  }
}

function validateImage(file: MultipartFile): AllowedImageMimeType {
  const mimeType = file.contentType.toLowerCase();

  if (!allowedImageMimeTypes.includes(mimeType as AllowedImageMimeType)) {
    throw new AppError(400, "Formato invalido. Envie uma imagem WEBP, PNG, JPG ou JPEG.");
  }

  if (file.content.length > maxUploadImageBytes) {
    throw new AppError(413, "Imagem muito grande. Envie um arquivo de ate 5 MB.");
  }

  if (file.content.length === 0) {
    throw new AppError(400, "O arquivo esta vazio.");
  }

  const extension = extensionFromFilename(file.filename);
  if (extension && !allowedImageExtensions.includes(extension as (typeof allowedImageExtensions)[number])) {
    throw new AppError(400, "Extensao invalida. Use webp, png, jpg ou jpeg.");
  }

  assertImageSignature(file);

  return mimeType as AllowedImageMimeType;
}

function normalizePath(path: string): string {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  const segments = normalized.split("/");

  if (!normalized || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new AppError(400, "Caminho de storage invalido.");
  }

  return normalized;
}

function isImagePath(path: string): boolean {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return imageExtensions.has(extension);
}

function isBucketFile(item: BucketListItem): boolean {
  return Boolean(item.metadata) || Boolean(item.id);
}

function contentTypeFromMetadata(item: BucketListItem): string | null {
  const value = item.metadata?.mimetype ?? item.metadata?.mimeType;
  return typeof value === "string" ? value : null;
}

function fileSizeFromMetadata(item: BucketListItem): number | null {
  const value = item.metadata?.size;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function joinPath(folder: string, name: string): string {
  return [folder, name].filter(Boolean).join("/");
}

async function listBucketImagesRecursively(folder = ""): Promise<StorageFile[]> {
  const files: StorageFile[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await productImagesBucket.list(folder, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" }
    });

    if (error) {
      throw new AppError(502, `Falha ao listar arquivos do storage: ${error.message}`);
    }

    const items = (data ?? []) as BucketListItem[];

    for (const item of items) {
      const path = joinPath(folder, item.name);

      if (!isBucketFile(item)) {
        files.push(...await listBucketImagesRecursively(path));
        continue;
      }

      const contentType = contentTypeFromMetadata(item);
      if (!(contentType?.startsWith("image/") || isImagePath(path))) {
        continue;
      }

      files.push({
        path,
        name: item.name,
        folder,
        publicUrl: getStoragePublicUrl(path),
        size: fileSizeFromMetadata(item),
        contentType,
        createdAt: item.created_at ?? null,
        updatedAt: item.updated_at ?? null,
        isUsed: false,
        usedBy: []
      });
    }

    if (items.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return files;
}

function pathFromPublicUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${storageBucketName}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

function addUsage(
  usageByPath: Map<string, StorageUsage[]>,
  path: string | null,
  usage: StorageUsage
): void {
  if (!path) return;

  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  const usages = usageByPath.get(normalized) ?? [];
  usages.push(usage);
  usageByPath.set(normalized, usages);
}

async function storageUsageByPath(): Promise<Map<string, StorageUsage[]>> {
  const [areas, events, productImages] = await prisma.$transaction([
    prisma.area.findMany({
      where: { coverImageUrl: { not: null } },
      select: { id: true, name: true, coverImageUrl: true }
    }),
    prisma.event.findMany({
      where: { coverImageUrl: { not: null } },
      select: { id: true, title: true, coverImageUrl: true }
    }),
    prisma.productImage.findMany({
      where: { imageUrl: { not: "" } },
      select: { id: true, imageUrl: true, altText: true, product: { select: { name: true } } }
    })
  ]);

  const usageByPath = new Map<string, StorageUsage[]>();

  for (const area of areas) {
    addUsage(usageByPath, pathFromPublicUrl(area.coverImageUrl ?? ""), {
      type: "area",
      id: area.id,
      label: area.name
    });
  }

  for (const event of events) {
    addUsage(usageByPath, pathFromPublicUrl(event.coverImageUrl ?? ""), {
      type: "event",
      id: event.id,
      label: event.title
    });
  }

  for (const image of productImages) {
    addUsage(usageByPath, pathFromPublicUrl(image.imageUrl), {
      type: "product_image",
      id: image.id,
      label: image.product?.name || image.altText || "Imagem de produto"
    });
  }

  return usageByPath;
}

async function listAnalyzedFiles(): Promise<StorageFile[]> {
  const [files, usageByPath] = await Promise.all([
    listBucketImagesRecursively(),
    storageUsageByPath()
  ]);

  return files
    .map((file) => {
      const usedBy = usageByPath.get(file.path) ?? [];
      return {
        ...file,
        isUsed: usedBy.length > 0,
        usedBy
      };
    })
    .sort((a, b) => {
      if (a.isUsed !== b.isUsed) return Number(a.isUsed) - Number(b.isUsed);
      return a.path.localeCompare(b.path);
    });
}

export const storageService = {
  async uploadImage({ folder, file }: UploadImageInput) {
    const contentType = validateImage(file);
    const extension = extensionFromFilename(file.filename) || extensionForMimeType(contentType);
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const path = `${folder}/${year}/${month}/${crypto.randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;

    const uploaded = await uploadStorageFile({
      path,
      body: file.content,
      contentType,
      cacheControl: "31536000",
      upsert: false
    });

    return {
      path: uploaded.path,
      publicUrl: uploaded.publicUrl,
      contentType,
      size: file.content.length,
      originalName: file.filename
    };
  },

  async listFiles() {
    const files = await listAnalyzedFiles();
    const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
    const unusedBytes = files.reduce((sum, file) => sum + (file.isUsed ? 0 : file.size ?? 0), 0);

    return {
      bucket: storageBucketName,
      summary: {
        total: files.length,
        used: files.filter((file) => file.isUsed).length,
        unused: files.filter((file) => !file.isUsed).length,
        totalBytes,
        unusedBytes
      },
      files
    };
  },

  async deleteUnusedFiles(paths: string[]) {
    const requestedPaths = Array.from(new Set(paths.map(normalizePath)));
    const files = await listAnalyzedFiles();
    const byPath = new Map(files.map((file) => [file.path, file]));

    const deleted: string[] = [];
    const skipped: Array<{ path: string; reason: string; usedBy?: StorageUsage[] }> = [];

    for (const path of requestedPaths) {
      const file = byPath.get(path);

      if (!file) {
        skipped.push({ path, reason: "Arquivo nao encontrado no bucket." });
        continue;
      }

      if (file.isUsed) {
        skipped.push({ path, reason: "Arquivo em uso.", usedBy: file.usedBy });
        continue;
      }

      deleted.push(path);
    }

    await deleteStorageFiles(deleted);

    return {
      deleted,
      skipped
    };
  }
};
