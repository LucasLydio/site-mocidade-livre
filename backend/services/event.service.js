const eventRepository = require("../repositories/event.repository");
const { buildPagination, getPagination } = require("../utils/pagination");
const { validateEventCoverUploadPayload, validateEventPayload, validateTogglePublishedPayload } = require("../utils/validators");
const { uploadFilesUploadObject, getPublicUrlFromStoragePath } = require("../config/storage");

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = "VALIDATION_ERROR";
  throw err;
}

function notFound(message) {
  const err = new Error(message);
  err.statusCode = 404;
  err.code = "NOT_FOUND";
  throw err;
}

function normalizeStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || raw === "all") return null;
  if (raw === "upcoming" || raw === "past") return raw;
  badRequest("Invalid status. Allowed: upcoming, past, all.");
}

function normalizeSearch(value) {
  const raw = String(value || "").trim();
  return raw ? raw : null;
}

function toNowIso() {
  return new Date().toISOString();
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function safeFilename(name) {
  const base = String(name || "image").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return base.replace(/-+/g, "-").replace(/^-|-$/g, "") || "image";
}

function decodeBase64(base64) {
  const raw = String(base64 || "").trim();
  const cleaned = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw;
  return Buffer.from(cleaned, "base64");
}

async function listPublishedEvents(query = {}) {
  const { page, limit, from, to } = getPagination(query);

  const status = normalizeStatus(query.status);
  const search = normalizeSearch(query.search);

  const result = await eventRepository.listEvents({
    from,
    to,
    isPublished: true,
    search,
    status,
    now: status ? toNowIso() : null,
  });

  return {
    items: result.data,
    pagination: buildPagination({ page, limit, total: result.count }),
  };
}

async function getPublishedEventById(id) {
  const eventId = String(id || "").trim();
  if (!eventId) badRequest("Event id is required.");

  const item = await eventRepository.getEventById(eventId, { isPublished: true });
  if (!item) notFound("Event not found.");
  return item;
}

async function listAdminEvents(query = {}) {
  const { page, limit, from, to } = getPagination(query);

  const status = normalizeStatus(query.status);
  const search = normalizeSearch(query.search);

  const wantsPublishedFilter = query.is_published !== undefined && query.is_published !== "";
  const isPublished = wantsPublishedFilter ? String(query.is_published).toLowerCase() === "true" : undefined;

  const result = await eventRepository.listEvents({
    from,
    to,
    isPublished,
    search,
    status,
    now: status ? toNowIso() : null,
  });

  return {
    items: result.data,
    pagination: buildPagination({ page, limit, total: result.count }),
  };
}

async function getAdminEventById(id) {
  const eventId = String(id || "").trim();
  if (!eventId) badRequest("Event id is required.");

  const item = await eventRepository.getEventById(eventId);
  if (!item) notFound("Event not found.");
  return item;
}

async function createEvent(payload, { createdBy } = {}) {
  const data = validateEventPayload(payload);

  return eventRepository.createEvent({
    ...data,
    created_by: createdBy || null,
  });
}

async function updateEvent(id, payload) {
  const eventId = String(id || "").trim();
  if (!eventId) badRequest("Event id is required.");

  const data = validateEventPayload(payload);

  const updated = await eventRepository.updateEvent(eventId, data);
  if (!updated) notFound("Event not found.");
  return updated;
}

async function deleteEvent(id) {
  const eventId = String(id || "").trim();
  if (!eventId) badRequest("Event id is required.");

  const deleted = await eventRepository.deleteEvent(eventId);
  if (!deleted) notFound("Event not found.");
  return deleted;
}

async function toggleEventPublished(id, payload) {
  const eventId = String(id || "").trim();
  if (!eventId) badRequest("Event id is required.");

  const { is_published } = validateTogglePublishedPayload(payload);
  const updated = await eventRepository.updateEvent(eventId, { is_published });
  if (!updated) notFound("Event not found.");
  return updated;
}

async function uploadCoverImage(payload) {
  const { event_id, filename, content_type, base64 } = validateEventCoverUploadPayload(payload);

  if (!ALLOWED_IMAGE_TYPES.has(content_type)) badRequest("Unsupported image type.");

  const buffer = decodeBase64(base64);
  if (!buffer.length) badRequest("Invalid image data.");
  if (buffer.length > MAX_IMAGE_BYTES) badRequest("Image too large (max 5MB).");

  const key = `events/${event_id}/${Date.now()}-${safeFilename(filename)}`;
  const uploaded = await uploadFilesUploadObject({ key, buffer, contentType: content_type });
  const publicUrl = getPublicUrlFromStoragePath(uploaded.storage_path);
  if (!publicUrl) {
    const err = new Error("Failed to generate image URL.");
    err.statusCode = 500;
    err.code = "INTERNAL_ERROR";
    throw err;
  }

  const updated = await eventRepository.updateEvent(event_id, { cover_image_url: publicUrl });
  if (!updated) notFound("Event not found.");

  return { event: updated, cover_image_url: publicUrl };
}

module.exports = {
  listPublishedEvents,
  getPublishedEventById,
  listAdminEvents,
  getAdminEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventPublished,
  uploadCoverImage,
};
