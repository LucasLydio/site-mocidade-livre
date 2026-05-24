const cartRepository = require("../repositories/cart.repository");
const productRepository = require("../repositories/product.repository");

function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.statusCode = 403;
  err.code = "FORBIDDEN";
  throw err;
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = "VALIDATION_ERROR";
  throw err;
}

function formatBrlFromCents(cents) {
  const value = (Number(cents) || 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getWhatsappNumber() {
  const raw = String(process.env.SHOP_WHATSAPP_NUMBER || "").trim();
  return raw || null;
}

function ensureCartOwner(cart, userId) {
  if (!cart) forbidden("Cart not found.");
  if (!cart.user_id || cart.user_id !== userId) forbidden("You do not have access to this cart.");
}

async function createCart({ userId }) {
  return cartRepository.createCart({ userId });
}

async function getCart({ userId, cartId }) {
  if (!cartId) badRequest("cart_id is required.");

  const cart = await cartRepository.getCartById(cartId);
  ensureCartOwner(cart, userId);

  const items = Array.isArray(cart.items) ? cart.items : [];
  items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return { ...cart, items };
}

async function addItem({ userId, cartId, productId, quantity }) {
  if (!cartId) badRequest("cart_id is required.");
  if (!productId) badRequest("product_id is required.");

  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || Number.isNaN(qty) || qty <= 0) badRequest("quantity must be > 0.");

  const cart = await cartRepository.getCartById(cartId);
  ensureCartOwner(cart, userId);

  if (cart.status !== "open") badRequest("Cart is not open.");

  const product = await productRepository.getProductForCartSnapshot(productId);
  if (!product || product.is_active === false) badRequest("Product not available.");

  const existing = await cartRepository.getCartItemByCartAndProduct(cartId, productId);

  if (existing) {
    const nextQty = existing.quantity + qty;
    return cartRepository.updateCartItem(existing.id, { quantity: nextQty });
  }

  return cartRepository.createCartItem({
    cart_id: cartId,
    product_id: productId,
    quantity: qty,
    unit_price_cents: product.price_cents,
    product_name: product.name,
  });
}

async function updateItem({ userId, cartItemId, quantity }) {
  if (!cartItemId) badRequest("Cart item id is required.");

  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || Number.isNaN(qty) || qty <= 0) badRequest("quantity must be > 0.");

  const item = await cartRepository.getCartItemById(cartItemId);
  const cart = await cartRepository.getCartById(item.cart_id);
  ensureCartOwner(cart, userId);

  if (cart.status !== "open") badRequest("Cart is not open.");

  return cartRepository.updateCartItem(cartItemId, { quantity: qty });
}

async function removeItem({ userId, cartItemId }) {
  if (!cartItemId) badRequest("Cart item id is required.");

  const item = await cartRepository.getCartItemById(cartItemId);
  const cart = await cartRepository.getCartById(item.cart_id);
  ensureCartOwner(cart, userId);

  if (cart.status !== "open") badRequest("Cart is not open.");

  return cartRepository.deleteCartItem(cartItemId);
}

async function checkoutWhatsapp({ userId, cartId, customer_name, customer_whatsapp, notes }) {
  if (!cartId) badRequest("cart_id is required.");
  if (!String(customer_name || "").trim()) badRequest("customer_name is required.");
  if (!String(customer_whatsapp || "").trim()) badRequest("customer_whatsapp is required.");

  const cart = await cartRepository.getCartById(cartId);
  ensureCartOwner(cart, userId);

  if (cart.status !== "open") badRequest("Cart is not open.");

  const items = Array.isArray(cart.items) ? cart.items : [];
  if (items.length === 0) badRequest("Cart is empty.");

  const totalCents = items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);

  const messageLines = [
    "Olá, quero fazer um pedido:",
    "",
    `Cliente: ${String(customer_name).trim()}`,
    `WhatsApp: ${String(customer_whatsapp).trim()}`,
    "",
    "Itens:",
    ...items.map((item) => `- ${item.product_name} x${item.quantity} — ${formatBrlFromCents(item.unit_price_cents)}`),
    "",
    `Total: ${formatBrlFromCents(totalCents)}`,
  ];

  const cleanNotes = String(notes || "").trim();
  if (cleanNotes) {
    messageLines.push(`Obs: ${cleanNotes}`);
  }

  const whatsappMessage = messageLines.join("\n");
  const receiver = getWhatsappNumber();
  if (!receiver) {
    const err = new Error("Missing SHOP_WHATSAPP_NUMBER env var.");
    err.statusCode = 500;
    err.code = "INTERNAL_ERROR";
    throw err;
  }

  const whatsappUrl = `https://wa.me/${encodeURIComponent(receiver)}?text=${encodeURIComponent(whatsappMessage)}`;

  await cartRepository.updateCart(cartId, {
    status: "sent_to_whatsapp",
    customer_name: String(customer_name).trim(),
    customer_whatsapp: String(customer_whatsapp).trim(),
    notes: cleanNotes || null,
  });

  const updatedCart = await cartRepository.getCartById(cartId);

  return {
    whatsapp_message: whatsappMessage,
    whatsapp_url: whatsappUrl,
    cart: updatedCart,
  };
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  checkoutWhatsapp,
};
