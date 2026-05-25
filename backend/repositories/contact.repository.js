const { supabase } = require("../config/supabase");

const INTEREST_FIELDS = "id, name, whatsapp, email, area_interest, message, status, created_at, updated_at";

async function createInterest(payload) {
  const { data, error } = await supabase.from("contact_interests").insert([payload]).select("id, status").single();
  if (error) throw error;
  return data;
}

async function listInterests({ from = 0, to = 49, status, search } = {}) {
  let query = supabase
    .from("contact_interests")
    .select(INTEREST_FIELDS, { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    const q = String(search).trim();
    const pattern = `%${q}%`;
    query = query.or(
      [
        `name.ilike.${pattern}`,
        `whatsapp.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `area_interest.ilike.${pattern}`,
        `message.ilike.${pattern}`,
      ].join(","),
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

async function getInterestById(id) {
  const { data, error } = await supabase.from("contact_interests").select(INTEREST_FIELDS).eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function updateInterestStatus(id, status) {
  const { data, error } = await supabase
    .from("contact_interests")
    .update({ status })
    .eq("id", id)
    .select(INTEREST_FIELDS)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function deleteInterest(id) {
  const { data, error } = await supabase.from("contact_interests").delete().eq("id", id).select(INTEREST_FIELDS).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

module.exports = {
  createInterest,
  listInterests,
  getInterestById,
  updateInterestStatus,
  deleteInterest,
};

