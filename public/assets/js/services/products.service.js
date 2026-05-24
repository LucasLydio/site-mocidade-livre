import { apiFetch } from '../core/api.js';

function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function listProducts({ categoryId, includeInactive = false } = {}) {
  return apiFetch(withQuery('/products', { categoryId, includeInactive: includeInactive ? 'true' : undefined }));
}

export async function getProductById(id, { includeInactive = false } = {}) {
  return apiFetch(withQuery('/products', { id, includeInactive: includeInactive ? 'true' : undefined }));
}

export async function getProductBySlug(slug, { includeInactive = false } = {}) {
  return apiFetch(withQuery('/products', { slug, includeInactive: includeInactive ? 'true' : undefined }));
}

export async function createProduct(payload) {
  return apiFetch('/products', { method: 'POST', body: payload });
}

export async function updateProduct(id, payload) {
  return apiFetch(withQuery('/products', { id }), { method: 'PUT', body: payload });
}

export async function deleteProduct(id) {
  return apiFetch(withQuery('/products', { id }), { method: 'DELETE' });
}

export async function uploadProductImage(product_id, file, { alt_text, is_cover = false, sort_order = 0 } = {}) {
  const base64 = await readFileAsDataUrl(file);
  return apiFetch('/products/images', {
    method: 'POST',
    body: {
      product_id,
      filename: file.name,
      content_type: file.type,
      file_base64: base64,
      alt_text,
      is_cover,
      sort_order
    }
  });
}

export async function updateProductImage(imageId, payload) {
  return apiFetch(withQuery('/products/images', { id: imageId }), { method: 'PUT', body: payload });
}

export async function deleteProductImage(imageId) {
  return apiFetch(withQuery('/products/images', { id: imageId }), { method: 'DELETE' });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}
