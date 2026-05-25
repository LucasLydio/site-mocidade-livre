const { supabase } = require("../config/supabase");

const EVENT_FIELDS =
  "id, title, summary, description, starts_at, ends_at, location_name, location_address, cover_image_url," +
  " is_published, created_by, created_at, updated_at";

async function listEvents({ from = 0, to = 19, isPublished, search, status, now } = {}) {
  let query = supabase.from("events").select(EVENT_FIELDS, { count: "exact" }).range(from, to);

  if (isPublished !== undefined) {
    query = query.eq("is_published", Boolean(isPublished));
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (status === "upcoming" && now) {
    query = query.gte("starts_at", now);
  }

  if (status === "past" && now) {
    query = query.lt("starts_at", now);
  }

  query = query.order("starts_at", { ascending: true });

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

async function getEventById(id, { isPublished } = {}) {
  let query = supabase.from("events").select(EVENT_FIELDS).eq("id", id);

  if (isPublished !== undefined) {
    query = query.eq("is_published", Boolean(isPublished));
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") throw error;

  return data || null;
}

async function createEvent(payload) {
  const { data, error } = await supabase.from("events").insert([payload]).select(EVENT_FIELDS).single();
  if (error) throw error;
  return data;
}

async function updateEvent(id, payload) {
  const { data, error } = await supabase.from("events").update(payload).eq("id", id).select(EVENT_FIELDS).single();

  if (error && error.code !== "PGRST116") throw error;

  return data || null;
}

async function deleteEvent(id) {
  const { data, error } = await supabase.from("events").delete().eq("id", id).select(EVENT_FIELDS).single();

  if (error && error.code !== "PGRST116") throw error;

  return data || null;
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};

