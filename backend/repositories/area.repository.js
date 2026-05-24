const { supabase } = require("../config/supabase");

const AREA_FIELDS = "id, name, slug, description, cover_image_url, is_active, created_at, updated_at";

async function listAreas({ includeInactive = false, search } = {}) {
  let query = supabase.from("areas").select(AREA_FIELDS).order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getAreaById(id) {
  const { data, error } = await supabase.from("areas").select(AREA_FIELDS).eq("id", id).single();
  if (error) throw error;
  return data;
}

async function getAreaBySlug(slug, { includeInactive = false } = {}) {
  let query = supabase.from("areas").select(AREA_FIELDS).eq("slug", slug).single();

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function createArea(payload) {
  const { data, error } = await supabase.from("areas").insert([payload]).select(AREA_FIELDS).single();
  if (error) throw error;
  return data;
}

async function updateArea(id, payload) {
  const { data, error } = await supabase.from("areas").update(payload).eq("id", id).select(AREA_FIELDS).single();
  if (error) throw error;
  return data;
}

async function deleteArea(id) {
  const { data, error } = await supabase.from("areas").delete().eq("id", id).select(AREA_FIELDS).single();
  if (error) throw error;
  return data;
}

module.exports = {
  listAreas,
  getAreaById,
  getAreaBySlug,
  createArea,
  updateArea,
  deleteArea,
};

