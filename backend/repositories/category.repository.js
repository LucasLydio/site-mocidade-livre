const { supabase } = require("../config/supabase");

async function listCategories({ from = 0, to = 99, isActive } = {}) {
  let query = supabase
    .from("categories")
    .select("id, name, slug, description, is_active, created_at, updated_at", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (isActive !== undefined) {
    query = query.eq("is_active", Boolean(isActive));
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

async function getCategoryById(id) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function createCategory(payload) {
  const { data, error } = await supabase
    .from("categories")
    .insert([payload])
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function updateCategory(id, payload) {
  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function deleteCategory(id) {
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id, name, slug, description, is_active, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

