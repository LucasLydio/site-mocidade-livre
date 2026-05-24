function badRequest(message, details) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = "VALIDATION_ERROR";
  if (details !== undefined) err.details = details;
  throw err;
}

function normalizeEmail(email) {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  return value || null;
}

function validateRegisterPayload(payload) {
  const name = String(payload?.name || "").trim();
  const email = normalizeEmail(payload?.email);
  const telephone = String(payload?.telephone ?? payload?.phone ?? "").trim();
  const password = String(payload?.password || "");

  const missing = [];
  if (!name) missing.push("name");
  if (!email) missing.push("email");
  if (!telephone) missing.push("telephone");
  if (!password) missing.push("password");

  if (missing.length) {
    badRequest(`Missing required fields: ${missing.join(", ")}`);
  }

  if (!email.includes("@")) badRequest("Invalid email.");
  if (password.length < 6) badRequest("Password must be at least 6 characters.");

  return { name, email, telephone, password };
}

function validateLoginPayload(payload) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");

  const missing = [];
  if (!email) missing.push("email");
  if (!password) missing.push("password");

  if (missing.length) {
    badRequest(`Missing required fields: ${missing.join(", ")}`);
  }

  if (!email.includes("@")) badRequest("Invalid email.");

  return { email, password };
}

function validateUpdateProfilePayload(payload) {
  const name = payload?.name !== undefined ? String(payload.name || "").trim() : undefined;
  const telephone = payload?.telephone !== undefined ? String(payload.telephone || "").trim() : undefined;

  if (name === undefined && telephone === undefined) {
    badRequest("No updatable fields provided. Allowed: name, telephone.");
  }

  if (name !== undefined && !name) badRequest("Name cannot be empty.");
  if (telephone !== undefined && !telephone) badRequest("Telephone cannot be empty.");

  return { name, telephone };
}

function validateSlug(slug, { field = "slug" } = {}) {
  const value = String(slug || "").trim();
  if (!value) badRequest(`Missing required field: ${field}`);

  const normalized = value.toLowerCase();
  if (normalized !== value) badRequest(`${field} must be lowercase.`);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    badRequest(`${field} must contain only lowercase letters, numbers, and hyphens.`);
  }

  return value;
}

function parseNonNegativeInt(value, { field }) {
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) badRequest(`${field} must be a number.`);
  if (n < 0) badRequest(`${field} must be >= 0.`);
  return n;
}

function validateCategoryPayload(payload) {
  const name = String(payload?.name || "").trim();
  const slug = validateSlug(payload?.slug, { field: "slug" });
  const description = payload?.description === undefined ? null : String(payload.description || "").trim() || null;
  const is_active = payload?.is_active === undefined ? true : Boolean(payload.is_active);

  if (!name) badRequest("Missing required field: name");

  return { name, slug, description, is_active };
}

function validateProductPayload(payload) {
  const name = String(payload?.name || "").trim();
  const slug = validateSlug(payload?.slug, { field: "slug" });
  const description = payload?.description === undefined ? null : String(payload.description || "").trim() || null;

  const category_id = payload?.category_id ? String(payload.category_id).trim() : null;
  const price_cents = parseNonNegativeInt(payload?.price_cents, { field: "price_cents" });
  const stock_qty = parseNonNegativeInt(payload?.stock_qty, { field: "stock_qty" });
  const is_active = payload?.is_active === undefined ? true : Boolean(payload.is_active);

  if (!name) badRequest("Missing required field: name");

  return { category_id, name, slug, description, price_cents, stock_qty, is_active };
}

function validateProductImageUploadPayload(payload) {
  const product_id = String(payload?.product_id || "").trim();
  const filename = String(payload?.filename || "").trim();
  const content_type = String(payload?.content_type || payload?.contentType || "").trim();
  const base64 = String(payload?.file_base64 || payload?.base64 || "").trim();
  const alt_text = payload?.alt_text === undefined ? null : String(payload.alt_text || "").trim() || null;
  const is_cover = payload?.is_cover === undefined ? false : Boolean(payload.is_cover);
  const sort_order = payload?.sort_order === undefined ? 0 : parseNonNegativeInt(payload.sort_order, { field: "sort_order" });

  if (!product_id) badRequest("Missing required field: product_id");
  if (!filename) badRequest("Missing required field: filename");
  if (!content_type) badRequest("Missing required field: content_type");
  if (!base64) badRequest("Missing required field: file_base64");

  return { product_id, filename, content_type, base64, alt_text, is_cover, sort_order };
}

function validateAreaPayload(payload) {
  const name = String(payload?.name || "").trim();
  const slug = validateSlug(payload?.slug, { field: "slug" });
  const description = payload?.description === undefined ? null : String(payload.description || "").trim() || null;
  const cover_image_url =
    payload?.cover_image_url === undefined ? null : String(payload.cover_image_url || "").trim() || null;
  const is_active = payload?.is_active === undefined ? true : Boolean(payload.is_active);

  if (!name) badRequest("Missing required field: name");

  if (cover_image_url) {
    try {
      const parsed = new URL(cover_image_url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        badRequest("cover_image_url must be a valid http(s) URL.");
      }
    } catch {
      badRequest("cover_image_url must be a valid http(s) URL.");
    }
  }

  return { name, slug, description, cover_image_url, is_active };
}

function validateAreaCoverUploadPayload(payload) {
  const area_id = String(payload?.area_id || "").trim();
  const slug = String(payload?.slug || "").trim();
  const filename = String(payload?.filename || "").trim();
  const content_type = String(payload?.content_type || payload?.contentType || "").trim();
  const base64 = String(payload?.file_base64 || payload?.base64 || "").trim();

  if (!area_id) badRequest("Missing required field: area_id");
  if (!slug) badRequest("Missing required field: slug");
  if (!filename) badRequest("Missing required field: filename");
  if (!content_type) badRequest("Missing required field: content_type");
  if (!base64) badRequest("Missing required field: file_base64");

  return { area_id, slug, filename, content_type, base64 };
}

module.exports = {
  normalizeEmail,
  validateRegisterPayload,
  validateLoginPayload,
  validateUpdateProfilePayload,
  validateSlug,
  validateCategoryPayload,
  validateProductPayload,
  validateProductImageUploadPayload,
  validateAreaPayload,
  validateAreaCoverUploadPayload,
};
