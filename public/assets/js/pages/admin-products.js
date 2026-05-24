import { clearSession, requireAuthRedirect } from '../core/session.js';
import { getMe as getUserMe } from '../services/user.service.js';
import { createCategory, listCategories } from '../services/categories.service.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
  uploadProductImage,
  updateProductImage,
  deleteProductImage
} from '../services/products.service.js';
import { formatBRLFromCents } from '../utils/format.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => {
    document.addEventListener('mocidade:layout-ready', resolve, { once: true });
  });
}

function setAlert(message, type = 'danger') {
  const el = document.getElementById('admin-alert');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function parseBrlToCents(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function fillCategorySelect(select, categories) {
  select.innerHTML = '<option value="">Sem categoria</option>';
  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.name}${cat.is_active ? '' : ' (inativa)'}`;
    select.appendChild(opt);
  }
}

function renderProductRows(products) {
  const tbody = document.querySelector('[data-admin-product-rows]');
  const cards = document.querySelector('[data-admin-product-cards]');
  const empty = document.querySelector('[data-admin-empty]');

  if (tbody) tbody.innerHTML = '';
  if (cards) cards.innerHTML = '';
  if (empty) empty.classList.toggle('d-none', products.length !== 0);

  for (const p of products) {
    const status = p.is_active ? 'Ativo' : 'Inativo';

    if (tbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="fw-semibold">${escapeHtml(p.name)}</div>
          <div class="text-secondary small">${escapeHtml(p.slug)}</div>
        </td>
        <td>${escapeHtml(formatBRLFromCents(p.price_cents))}</td>
        <td>${escapeHtml(String(p.stock_qty ?? 0))}</td>
        <td><span class="badge ${p.is_active ? 'text-bg-success' : 'text-bg-secondary'}">${status}</span></td>
        <td class="text-end">
          <button class="btn btn-outline-secondary btn-sm" type="button" data-admin-edit="${p.id}">
            <i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    if (cards) {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-4 border';
      card.style.borderColor = 'var(--border)';
      card.style.background = 'var(--surface)';
      card.innerHTML = `
        <div class="d-flex justify-content-between gap-2">
          <div>
            <div class="fw-semibold">${escapeHtml(p.name)}</div>
            <div class="text-secondary small">${escapeHtml(formatBRLFromCents(p.price_cents))} • estoque ${escapeHtml(
        String(p.stock_qty ?? 0),
      )}</div>
          </div>
          <button class="btn btn-outline-secondary btn-sm" type="button" data-admin-edit="${p.id}">Editar</button>
        </div>
      `;
      cards.appendChild(card);
    }
  }
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setLoading(isLoading) {
  document.querySelector('[data-admin-loading]')?.classList.toggle('d-none', !isLoading);
}

function setFormMode(form, { product = null } = {}) {
  const deleteBtn = document.querySelector('[data-admin-delete-product]');
  if (!form) return;

  form.reset();
  form.querySelector('[name="id"]').value = product?.id || '';
  form.querySelector('[name="category_id"]').value = product?.category_id || '';
  form.querySelector('[name="name"]').value = product?.name || '';
  form.querySelector('[name="slug"]').value = product?.slug || '';
  form.querySelector('[name="description"]').value = product?.description || '';
  form.querySelector('[name="stock_qty"]').value = String(product?.stock_qty ?? 0);
  form.querySelector('[name="is_active"]').checked = product ? Boolean(product.is_active) : true;

  const priceBrl = product ? formatBRLFromCents(product.price_cents).replace('R$', '').trim() : '';
  form.querySelector('[name="price_brl"]').value = priceBrl;

  if (deleteBtn) deleteBtn.disabled = !product?.id;

  const uploadBtn = document.querySelector('[data-admin-upload-image]');
  if (uploadBtn) uploadBtn.disabled = !product?.id;
}

function renderImages(images = []) {
  const root = document.querySelector('[data-admin-images]');
  if (!root) return;

  root.innerHTML = '';

  if (!images.length) {
    const empty = document.createElement('div');
    empty.className = 'text-secondary small';
    empty.textContent = 'Nenhuma imagem enviada.';
    root.appendChild(empty);
    return;
  }

  for (const img of images.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))) {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center justify-content-between gap-3 p-2 rounded-4 border';
    row.style.borderColor = 'var(--border)';
    row.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.alt_text || 'Imagem do produto')}" />
        <div>
          <div class="text-secondary small">${escapeHtml(img.alt_text || '(sem alt)')}</div>
          <div class="d-flex align-items-center gap-2 mt-1">
            <div class="form-check">
              <input class="form-check-input" type="radio" name="coverRadio" data-admin-cover="${img.id}" ${
                img.is_cover ? 'checked' : ''
              } />
              <label class="form-check-label">Capa</label>
            </div>
          </div>
        </div>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" data-admin-delete-image="${img.id}">
        <i class="bi bi-trash" aria-hidden="true"></i>
      </button>
    `;
    root.appendChild(row);
  }
}

async function init() {
  await waitForLayoutReady();

  if (!requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/products.html' })) return;

  let me;
  try {
    me = await getUserMe();
  } catch (err) {
    if ((err?.statusCode || err?.status) === 401) {
      clearSession();
      requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/products.html' });
      return;
    }
    setAlert(err.message || 'Falha ao carregar sessão.', 'danger');
    return;
  }

  if (me.role !== 'admin') {
    setAlert('Acesso restrito: admin somente.', 'warning');
    window.location.href = '../index.html';
    return;
  }

  const form = document.getElementById('admin-product-form');
  const categorySelect = form?.querySelector('[name="category_id"]');

  let categories = [];
  let products = [];
  let currentProduct = null;

  async function loadAll() {
    setAlert(null);
    setLoading(true);
    try {
      const categoriesRes = await listCategories({ includeInactive: true, limit: 200, offset: 0 });
      categories = categoriesRes.items || [];
      if (categorySelect) fillCategorySelect(categorySelect, categories);

      products = await listProducts({ includeInactive: true });
      renderProductRows(products);
    } catch (err) {
      setAlert(err.message || 'Falha ao carregar dados.', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function loadProduct(id) {
    currentProduct = await getProductById(id, { includeInactive: true });
    setFormMode(form, { product: currentProduct });
    renderImages(currentProduct.images || []);
  }

  document.querySelector('[data-admin-refresh]')?.addEventListener('click', loadAll);

  document.querySelector('[data-admin-clear-form]')?.addEventListener('click', () => {
    currentProduct = null;
    setFormMode(form, { product: null });
    renderImages([]);
  });

  document.addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-admin-edit]')?.getAttribute('data-admin-edit');
    if (editId) {
      try {
        setAlert(null);
        await loadProduct(editId);
      } catch (err) {
        setAlert(err.message || 'Falha ao carregar produto.', 'danger');
      }
    }

    const deleteImgId = e.target.closest('[data-admin-delete-image]')?.getAttribute('data-admin-delete-image');
    if (deleteImgId) {
      if (!confirm('Excluir esta imagem?')) return;
      try {
        await deleteProductImage(deleteImgId);
        await loadProduct(currentProduct.id);
        setAlert('Imagem excluída.', 'success');
      } catch (err) {
        setAlert(err.message || 'Falha ao excluir imagem.', 'danger');
      }
    }

    const coverId = e.target.closest('[data-admin-cover]')?.getAttribute('data-admin-cover');
    if (coverId && currentProduct?.id) {
      try {
        await updateProductImage(coverId, { is_cover: true });
        await loadProduct(currentProduct.id);
        setAlert('Capa atualizada.', 'success');
      } catch (err) {
        setAlert(err.message || 'Falha ao atualizar capa.', 'danger');
      }
    }
  });

  document.querySelector('[data-admin-new-category]')?.addEventListener('click', () => {
    document.querySelector('[data-admin-category-form]')?.classList.toggle('d-none', false);
  });

  document.querySelector('[data-admin-cancel-category]')?.addEventListener('click', () => {
    document.querySelector('[data-admin-category-form]')?.classList.toggle('d-none', true);
  });

  document.querySelector('[data-admin-create-category]')?.addEventListener('click', async () => {
    const name = document.querySelector('[name="cat_name"]')?.value?.trim();
    const slug = document.querySelector('[name="cat_slug"]')?.value?.trim();
    try {
      const created = await createCategory({ name, slug, is_active: true });
      setAlert('Categoria criada.', 'success');
      document.querySelector('[data-admin-category-form]')?.classList.add('d-none');
      await loadAll();
      if (categorySelect) categorySelect.value = created.id;
    } catch (err) {
      setAlert(err.message || 'Falha ao criar categoria.', 'danger');
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert(null);

    const id = form.querySelector('[name="id"]').value.trim();
    const category_id = form.querySelector('[name="category_id"]').value.trim() || null;
    const name = form.querySelector('[name="name"]').value.trim();
    const slug = form.querySelector('[name="slug"]').value.trim();
    const description = form.querySelector('[name="description"]').value.trim() || null;
    const price_cents = parseBrlToCents(form.querySelector('[name="price_brl"]').value);
    const stock_qty = parseInt(form.querySelector('[name="stock_qty"]').value, 10);
    const is_active = form.querySelector('[name="is_active"]').checked;

    if (price_cents === null) {
      setAlert('Preço inválido.', 'warning');
      return;
    }

    const payload = { category_id, name, slug, description, price_cents, stock_qty, is_active };

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const saved = id ? await updateProduct(id, payload) : await createProduct(payload);
      setAlert('Produto salvo.', 'success');
      await loadAll();
      await loadProduct(saved.id);
    } catch (err) {
      setAlert(err.message || 'Falha ao salvar produto.', 'danger');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  document.querySelector('[data-admin-delete-product]')?.addEventListener('click', async () => {
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    if (!id) return;
    if (!confirm('Excluir este produto? Isso também removerá as imagens.')) return;

    try {
      await deleteProduct(id);
      setAlert('Produto excluído.', 'success');
      currentProduct = null;
      setFormMode(form, { product: null });
      renderImages([]);
      await loadAll();
    } catch (err) {
      setAlert(err.message || 'Falha ao excluir produto.', 'danger');
    }
  });

  document.querySelector('[data-admin-upload-image]')?.addEventListener('click', async () => {
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    if (!id) return;

    const fileInput = document.getElementById('admin-image-file');
    const file = fileInput?.files?.[0];
    if (!file) {
      setAlert('Selecione um arquivo de imagem.', 'warning');
      return;
    }

    const alt_text = document.getElementById('admin-image-alt')?.value?.trim() || null;
    const is_cover = Boolean(document.getElementById('admin-image-cover')?.checked);

    try {
      setAlert(null);
      const btn = document.querySelector('[data-admin-upload-image]');
      if (btn) btn.disabled = true;
      await uploadProductImage(id, file, { alt_text, is_cover });
      await loadProduct(id);
      if (fileInput) fileInput.value = '';
      const alt = document.getElementById('admin-image-alt');
      if (alt) alt.value = '';
      const cover = document.getElementById('admin-image-cover');
      if (cover) cover.checked = false;
      setAlert('Imagem enviada.', 'success');
    } catch (err) {
      setAlert(err.message || 'Falha ao enviar imagem.', 'danger');
    } finally {
      const btn = document.querySelector('[data-admin-upload-image]');
      if (btn) btn.disabled = !id;
    }
  });

  // Enable upload button when a product is selected
  document.getElementById('admin-image-file')?.addEventListener('change', () => {
    const btn = document.querySelector('[data-admin-upload-image]');
    if (!btn) return;
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    btn.disabled = !id;
  });

  await loadAll();
  setFormMode(form, { product: null });
  renderImages([]);
}

void init();

