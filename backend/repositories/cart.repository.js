const { supabase } = require("../config/supabase");

const CART_SELECT =
  "id, user_id, status, customer_name, customer_whatsapp, notes, created_at, updated_at," +
  " items:cart_items(id, cart_id, product_id, quantity, unit_price_cents, product_name, created_at, updated_at)";

async function createCart({ userId }) {
  const { data, error } = await supabase
    .from("carts")
    .insert([{ user_id: userId, status: "open" }])
    .select("id, user_id, status, customer_name, customer_whatsapp, notes, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function getCartById(id) {
  const { data, error } = await supabase.from("carts").select(CART_SELECT).eq("id", id).single();
  if (error) throw error;
  return data;
}

async function updateCart(id, payload) {
  const { data, error } = await supabase
    .from("carts")
    .update(payload)
    .eq("id", id)
    .select("id, user_id, status, customer_name, customer_whatsapp, notes, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function getCartItemById(id) {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, unit_price_cents, product_name, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function getCartItemByCartAndProduct(cartId, productId) {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, unit_price_cents, product_name, created_at, updated_at")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function createCartItem(payload) {
  const { data, error } = await supabase
    .from("cart_items")
    .insert([payload])
    .select("id, cart_id, product_id, quantity, unit_price_cents, product_name, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function updateCartItem(id, payload) {
  const { data, error } = await supabase
    .from("cart_items")
    .update(payload)
    .eq("id", id)
    .select("id, cart_id, product_id, quantity, unit_price_cents, product_name, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function deleteCartItem(id) {
  const { data, error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", id)
    .select("id, cart_id, product_id, quantity, unit_price_cents, product_name, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  createCart,
  getCartById,
  updateCart,
  getCartItemById,
  getCartItemByCartAndProduct,
  createCartItem,
  updateCartItem,
  deleteCartItem,
};
