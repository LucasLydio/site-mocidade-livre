const areaRepository = require("../repositories/area.repository");
const { validateAreaCoverUploadPayload, validateAreaPayload } = require("../utils/validators");
const { uploadFilesUploadObject, getPublicUrlFromStoragePath } = require("../config/storage");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = "VALIDATION_ERROR";
  throw err;
}

function safeFilename(name) {
  const base = String(name || "image").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return base.replace(/-+/g, "-").replace(/^-|-$/g, "") || "image";
}

function decodeBase64(base64) {
  const raw = String(base64 || "").trim();
  const cleaned = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw;
  return Buffer.from(cleaned, "base64");
}

async function listActiveAreas() {
  return areaRepository.listAreas({ includeInactive: false });
}

async function getAreaBySlug(slug) {
  if (!slug) badRequest("Area slug is required.");
  return areaRepository.getAreaBySlug(slug, { includeInactive: false });
}

async function listAreasAdmin({ search } = {}) {
  return areaRepository.listAreas({ includeInactive: true, search: search ? String(search).trim() : null });
}

async function getAreaByIdAdmin(id) {
  if (!id) badRequest("Area id is required.");
  return areaRepository.getAreaById(id);
}

async function createArea(payload) {
  const data = validateAreaPayload(payload);
  return areaRepository.createArea(data);
}

async function updateArea(id, payload) {
  if (!id) badRequest("Area id is required.");
  const data = validateAreaPayload(payload);
  return areaRepository.updateArea(id, data);
}

async function deleteArea(id) {
  if (!id) badRequest("Area id is required.");
  return areaRepository.deleteArea(id);
}

async function toggleAreaActive(id, isActive) {
  if (!id) badRequest("Area id is required.");
  return areaRepository.updateArea(id, { is_active: Boolean(isActive) });
}

async function uploadCoverImage(payload) {
  const { area_id, slug, filename, content_type, base64 } = validateAreaCoverUploadPayload(payload);

  if (!ALLOWED_IMAGE_TYPES.has(content_type)) badRequest("Unsupported image type.");

  const buffer = decodeBase64(base64);
  if (!buffer.length) badRequest("Invalid image data.");
  if (buffer.length > MAX_IMAGE_BYTES) badRequest("Image too large (max 5MB).");

  const key = `areas/${slug}/${Date.now()}-${safeFilename(filename)}`;
  const uploaded = await uploadFilesUploadObject({ key, buffer, contentType: content_type });
  const publicUrl = getPublicUrlFromStoragePath(uploaded.storage_path);
  if (!publicUrl) {
    const err = new Error("Failed to generate image URL.");
    err.statusCode = 500;
    err.code = "INTERNAL_ERROR";
    throw err;
  }

  const area = await areaRepository.updateArea(area_id, { cover_image_url: publicUrl });
  return { area, cover_image_url: publicUrl };
}

module.exports = {
  listActiveAreas,
  getAreaBySlug,
  listAreasAdmin,
  getAreaByIdAdmin,
  createArea,
  updateArea,
  deleteArea,
  toggleAreaActive,
  uploadCoverImage,
};

