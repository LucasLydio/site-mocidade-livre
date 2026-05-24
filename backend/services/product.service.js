const productRepository = require("../repositories/product.repository");
const { validateProductImageUploadPayload, validateProductPayload } = require("../utils/validators");
const { uploadFilesUploadObject, getPublicUrlFromStoragePath } = require("../config/storage");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function toProductResponse(product) {
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images.slice() : [];
  images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const cover = images.find((img) => img.is_cover) || images[0] || null;

  return {
    id: product.id,
    category_id: product.category_id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price_cents: product.price_cents,
    stock_qty: product.stock_qty,
    is_active: product.is_active,
    created_at: product.created_at,
    updated_at: product.updated_at,
    category: product.category || null,
    images,
    cover_image: cover,
  };
}

async function listProducts({ categoryId, includeInactive } = {}) {
  const products = await productRepository.listProducts({ categoryId, includeInactive });
  return products.map(toProductResponse);
}

async function getProductById(id, { includeInactive } = {}) {
  if (!id) {
    const err = new Error("Product id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const product = await productRepository.getProductById(id, { includeInactive });
  return toProductResponse(product);
}

async function getProductBySlug(slug, { includeInactive } = {}) {
  if (!slug) {
    const err = new Error("Product slug is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const product = await productRepository.getProductBySlug(slug, { includeInactive });
  return toProductResponse(product);
}

async function createProduct(payload) {
  const data = validateProductPayload(payload);
  const product = await productRepository.createProduct(data);
  return toProductResponse(product);
}

async function updateProduct(id, payload) {
  if (!id) {
    const err = new Error("Product id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const data = validateProductPayload(payload);
  const product = await productRepository.updateProduct(id, data);
  return toProductResponse(product);
}

async function removeProduct(id) {
  if (!id) {
    const err = new Error("Product id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const product = await productRepository.deleteProduct(id);
  return toProductResponse(product);
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

async function uploadProductImage(payload) {
  const { product_id, filename, content_type, base64, alt_text, is_cover, sort_order } =
    validateProductImageUploadPayload(payload);

  if (!ALLOWED_IMAGE_TYPES.has(content_type)) {
    const err = new Error("Unsupported image type.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const buffer = decodeBase64(base64);
  if (!buffer.length) {
    const err = new Error("Invalid image data.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    const err = new Error("Image too large (max 5MB).");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const product = await productRepository.getProductById(product_id, { includeInactive: true });
  const productSlugOrId = product?.slug || product_id;
  const key = `products/${productSlugOrId}/${Date.now()}-${safeFilename(filename)}`;

  const uploaded = await uploadFilesUploadObject({ key, buffer, contentType: content_type });
  const publicUrl = getPublicUrlFromStoragePath(uploaded.storage_path);

  if (!publicUrl) {
    const err = new Error("Failed to generate image URL.");
    err.statusCode = 500;
    err.code = "INTERNAL_ERROR";
    throw err;
  }

  if (is_cover) {
    await productRepository.unsetCoverImages(product_id);
  }

  return productRepository.createProductImage({
    product_id,
    image_url: publicUrl,
    alt_text,
    is_cover,
    sort_order,
  });
}

async function updateProductImage(imageId, payload) {
  if (!imageId) {
    const err = new Error("Image id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const current = await productRepository.getProductImageById(imageId);

  const update = {};

  if (payload?.alt_text !== undefined) {
    update.alt_text = String(payload.alt_text || "").trim() || null;
  }

  if (payload?.sort_order !== undefined) {
    const n = parseInt(payload.sort_order, 10);
    if (!Number.isFinite(n) || Number.isNaN(n) || n < 0) {
      const err = new Error("sort_order must be a non-negative number.");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }
    update.sort_order = n;
  }

  if (payload?.is_cover !== undefined) {
    const wantsCover = Boolean(payload.is_cover);
    if (wantsCover) {
      await productRepository.unsetCoverImages(current.product_id);
    }
    update.is_cover = wantsCover;
  }

  return productRepository.updateProductImage(imageId, update);
}

async function removeProductImage(imageId) {
  if (!imageId) {
    const err = new Error("Image id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  return productRepository.deleteProductImage(imageId);
}

module.exports = {
  listProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  removeProduct,
  uploadProductImage,
  updateProductImage,
  removeProductImage,
};
