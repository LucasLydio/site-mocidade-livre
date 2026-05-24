const { supabase } = require("../config/supabase");

const PRODUCT_SELECT =
  "id, category_id, name, slug, description, price_cents, stock_qty, is_active, created_at, updated_at," +
  " category:categories(id, name, slug, description, is_active, created_at, updated_at)," +
  " images:product_images(id, product_id, image_url, alt_text, is_cover, sort_order, created_at)";

async function listProducts({ categoryId, includeInactive = false } = {}) {
  let query = supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  query = query.order("sort_order", { foreignTable: "product_images", ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getProductById(id, { includeInactive = false } = {}) {
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("id", id).single();

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getProductBySlug(slug, { includeInactive = false } = {}) {
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).single();

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getProductForCartSnapshot(id) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price_cents, stock_qty, is_active")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function createProduct(payload) {
  const { data, error } = await supabase.from("products").insert([payload]).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}

async function updateProduct(id, payload) {
  const { data, error } = await supabase.from("products").update(payload).eq("id", id).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}

async function deleteProduct(id) {
  const { data, error } = await supabase.from("products").delete().eq("id", id).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}

async function unsetCoverImages(productId) {
  const { error } = await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);
  if (error) throw error;
}

async function createProductImage(payload) {
  const { data, error } = await supabase
    .from("product_images")
    .insert([payload])
    .select("id, product_id, image_url, alt_text, is_cover, sort_order, created_at")
    .single();

  if (error) throw error;
  return data;
}

async function updateProductImage(id, payload) {
  const { data, error } = await supabase
    .from("product_images")
    .update(payload)
    .eq("id", id)
    .select("id, product_id, image_url, alt_text, is_cover, sort_order, created_at")
    .single();

  if (error) throw error;
  return data;
}

async function deleteProductImage(id) {
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", id)
    .select("id, product_id, image_url, alt_text, is_cover, sort_order, created_at")
    .single();

  if (error) throw error;
  return data;
}

async function getProductImageById(id) {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, product_id, image_url, alt_text, is_cover, sort_order, created_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  listProducts,
  getProductById,
  getProductBySlug,
  getProductForCartSnapshot,
  createProduct,
  updateProduct,
  deleteProduct,
  unsetCoverImages,
  createProductImage,
  updateProductImage,
  deleteProductImage,
  getProductImageById,
};
