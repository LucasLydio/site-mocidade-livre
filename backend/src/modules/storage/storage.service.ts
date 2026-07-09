import crypto from "node:crypto";
import { uploadStorageFile } from "../../config/storage";
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
  }
};
