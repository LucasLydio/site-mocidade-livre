import { getJson, remove, setJson } from '../core/storage.js';
import { isAuthenticated } from '../core/session.js';
import { formatBRLFromCents } from '../utils/format.js';
import { addCartItem, checkoutWhatsapp, createCart, getCart, removeCartItem, updateCartItem } from '../services/cart.service.js';

const CART_ID_KEY = 'mocidade_cart_id';

function getCartId() {
  return getJson(CART_ID_KEY, null);
}

function setCartId(id) {
  setJson(CART_ID_KEY, id);
}

function clearCartId() {
  remove(CART_ID_KEY);
}

function sumTotalCents(items = []) {
  return items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);
}

function renderCart(root, cart) {
  const itemsRoot = root.querySelector('[data-cart-items]');
  const totalRoot = root.querySelector('[data-cart-total]');
  const emptyRoot = root.querySelector('[data-cart-empty]');

  const items = cart?.items || [];
  if (itemsRoot) itemsRoot.innerHTML = '';

  if (emptyRoot) emptyRoot.classList.toggle('d-none', items.length !== 0);

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'cart-item d-flex align-items-center justify-content-between gap-3 py-2 border-bottom';
    row.innerHTML = `
      <div class="flex-grow-1">
        <div class="fw-semibold">${escapeHtml(item.product_name)}</div>
        <div class="text-secondary small">${formatBRLFromCents(item.unit_price_cents)} • <span data-item-subtotal></span></div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" type="button" data-cart-dec="${item.id}" aria-label="Diminuir">-</button>
        <input class="form-control form-control-sm text-center" style="width: 64px" inputmode="numeric" data-cart-qty="${item.id}" value="${item.quantity}" />
        <button class="btn btn-outline-secondary btn-sm" type="button" data-cart-inc="${item.id}" aria-label="Aumentar">+</button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-cart-remove="${item.id}" aria-label="Remover"><i class="bi bi-trash"></i></button>
      </div>
    `;

    row.querySelector('[data-item-subtotal]')?.append(formatBRLFromCents(item.unit_price_cents * item.quantity));
    itemsRoot?.appendChild(row);
  }

  const totalCents = sumTotalCents(items);
  if (totalRoot) totalRoot.textContent = formatBRLFromCents(totalCents);
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setAlert(root, message, type = 'danger') {
  const el = root.querySelector('[data-cart-alert]');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

export async function initCartUi({ root = document } = {}) {
  const panel = root.querySelector('[data-cart-panel]');
  if (!panel) return null;

  if (!isAuthenticated()) {
    panel.querySelector('[data-cart-auth-required]')?.classList.remove('d-none');
    panel.querySelector('[data-cart-app]')?.classList.add('d-none');
    return {
      async addProduct() {
        setAlert(panel, 'Faça login para usar o carrinho.', 'warning');
      }
    };
  }

  panel.querySelector('[data-cart-auth-required]')?.classList.add('d-none');
  panel.querySelector('[data-cart-app]')?.classList.remove('d-none');

  let cartId = getCartId();
  let cart = null;

  async function ensureCart() {
    if (!cartId) {
      const created = await createCart();
      cartId = created.id;
      setCartId(cartId);
    }

    const loaded = await getCart(cartId);
    if (loaded.status !== 'open') {
      clearCartId();
      cartId = null;
      cart = null;
      return ensureCart();
    }

    cart = loaded;
    renderCart(panel, cart);
    return cart;
  }

  async function refresh() {
    if (!cartId) return ensureCart();
    cart = await getCart(cartId);
    renderCart(panel, cart);
    return cart;
  }

  async function addProduct(productId, quantity = 1) {
    setAlert(panel, null);
    await ensureCart();
    await addCartItem({ cart_id: cartId, product_id: productId, quantity });
    await refresh();
  }

  panel.addEventListener('click', async (e) => {
    const inc = e.target.closest('[data-cart-inc]')?.getAttribute('data-cart-inc');
    const dec = e.target.closest('[data-cart-dec]')?.getAttribute('data-cart-dec');
    const removeId = e.target.closest('[data-cart-remove]')?.getAttribute('data-cart-remove');

    try {
      if (inc) {
        const item = cart?.items?.find((i) => i.id === inc);
        if (!item) return;
        await updateCartItem(inc, { quantity: item.quantity + 1 });
        await refresh();
      } else if (dec) {
        const item = cart?.items?.find((i) => i.id === dec);
        if (!item) return;
        const next = item.quantity - 1;
        if (next <= 0) {
          await removeCartItem(dec);
        } else {
          await updateCartItem(dec, { quantity: next });
        }
        await refresh();
      } else if (removeId) {
        await removeCartItem(removeId);
        await refresh();
      }
    } catch (err) {
      setAlert(panel, err.message || 'Falha ao atualizar carrinho.', 'danger');
    }
  });

  panel.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-cart-qty]');
    if (!input) return;

    const id = input.getAttribute('data-cart-qty');
    const qty = parseInt(input.value, 10);

    try {
      if (!Number.isFinite(qty) || Number.isNaN(qty) || qty <= 0) {
        input.value = String(cart?.items?.find((i) => i.id === id)?.quantity || 1);
        return;
      }

      await updateCartItem(id, { quantity: qty });
      await refresh();
    } catch (err) {
      setAlert(panel, err.message || 'Falha ao atualizar carrinho.', 'danger');
      input.value = String(cart?.items?.find((i) => i.id === id)?.quantity || 1);
    }
  });

  panel.querySelector('[data-cart-checkout]')?.addEventListener('click', async () => {
    const name = panel.querySelector('[name="customer_name"]')?.value?.trim();
    const whatsapp = panel.querySelector('[name="customer_whatsapp"]')?.value?.trim();
    const notes = panel.querySelector('[name="notes"]')?.value?.trim();

    try {
      setAlert(panel, null);
      await ensureCart();

      const result = await checkoutWhatsapp({
        cart_id: cartId,
        customer_name: name,
        customer_whatsapp: whatsapp,
        notes
      });

      if (result?.whatsapp_url) {
        window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer');
      }

      await refresh();
      setAlert(panel, 'Pedido pronto! Abrimos o WhatsApp em outra aba.', 'success');
    } catch (err) {
      setAlert(panel, err.message || 'Falha no checkout.', 'danger');
    }
  });

  await ensureCart();

  return { addProduct, refresh };
}
