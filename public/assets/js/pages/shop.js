import { initCartUi } from '../components/cart-ui.js';
import { listCategories } from '../services/categories.service.js';
import { listProducts } from '../services/products.service.js';
import { formatBRLFromCents } from '../utils/format.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener('mocidade:layout-ready', resolve, { once: true });
  });
}

function setAlert(message, type = 'danger') {
  const el = document.querySelector('[data-shop-alert]');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function renderCategoryFilters({ categories, activeCategoryId }) {
  const root = document.querySelector('[data-shop-filters]');
  if (!root) return;

  root.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `btn btn-sm ${!activeCategoryId ? 'btn-dark' : 'btn-outline-secondary'}`;
  allBtn.textContent = 'Todos';
  allBtn.setAttribute('data-category-id', '');
  root.appendChild(allBtn);

  for (const cat of categories) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-sm ${activeCategoryId === cat.id ? 'btn-dark' : 'btn-outline-secondary'}`;
    btn.textContent = cat.name;
    btn.setAttribute('data-category-id', cat.id);
    root.appendChild(btn);
  }
}

function renderProducts(products) {
  const root = document.querySelector('[data-shop-grid]');
  const empty = document.querySelector('[data-shop-empty]');

  if (!root) return;

  root.innerHTML = '';
  if (empty) empty.classList.toggle('d-none', products.length !== 0);

  const tpl = document.getElementById('product-card-template');

  for (const product of products) {
    const node = tpl?.content?.firstElementChild
      ? tpl.content.firstElementChild.cloneNode(true)
      : document.createElement('div');

    node.setAttribute('data-product-id', product.id);

    const img = node.querySelector('[data-product-image]');
    if (img) {
      const src = product.cover_image?.image_url || 'assets/images/shop/placeholder.svg';
      img.setAttribute('src', src);
      img.setAttribute('alt', product.cover_image?.alt_text || product.name);
    }

    node.querySelector('[data-product-name]')?.append(product.name);
    node.querySelector('[data-product-description]')?.append(product.description || '');
    node.querySelector('[data-product-price]')?.append(formatBRLFromCents(product.price_cents));

    const stock = node.querySelector('[data-product-stock]');
    if (stock) {
      const inStock = (product.stock_qty ?? 0) > 0;
      stock.className = `badge ${inStock ? 'text-bg-success' : 'text-bg-secondary'}`;
      stock.textContent = inStock ? `Em estoque (${product.stock_qty})` : 'Sem estoque';
    }

    const btn = node.querySelector('[data-add-to-cart]');
    if (btn) {
      btn.disabled = (product.stock_qty ?? 0) <= 0;
    }

    root.appendChild(node);
  }
}

async function init() {
  await waitForLayoutReady();

  setAlert(null);

  const cartUi = await initCartUi({ root: document });

  let activeCategoryId = null;
  let categories = [];

  async function load() {
    document.querySelector('[data-shop-loading]')?.classList.remove('d-none');

    try {
      const categoriesRes = await listCategories({ is_active: true, limit: 100, offset: 0 });
      categories = categoriesRes.items || categoriesRes || [];
      renderCategoryFilters({ categories, activeCategoryId });

      const products = await listProducts({ categoryId: activeCategoryId });
      renderProducts(products || []);
    } catch (err) {
      setAlert(err.message || 'Falha ao carregar a loja.', 'danger');
    } finally {
      document.querySelector('[data-shop-loading]')?.classList.add('d-none');
    }
  }

  document.addEventListener('click', async (e) => {
    const filterBtn = e.target.closest('[data-category-id]');
    if (filterBtn && filterBtn.closest('[data-shop-filters]')) {
      activeCategoryId = filterBtn.getAttribute('data-category-id') || null;
      renderCategoryFilters({ categories, activeCategoryId });
      await load();
      return;
    }

    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      const card = addBtn.closest('[data-product-id]');
      const productId = card?.getAttribute('data-product-id');
      if (!productId) return;

      try {
        addBtn.disabled = true;
        await cartUi?.addProduct?.(productId, 1);
      } finally {
        addBtn.disabled = false;
      }
    }
  });

  await load();
}

void init();
