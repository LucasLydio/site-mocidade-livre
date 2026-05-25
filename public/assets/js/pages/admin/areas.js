import { clearSession, requireAuthRedirect } from '../../core/session.js';
import { getMe as getUserMe } from '../../services/user.service.js';
import { createArea, deleteArea, getAdminAreas, toggleAreaActive, updateArea, uploadAreaCover } from '../../services/areas.service.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true }));
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

function setLoading(isLoading) {
  document.querySelector('[data-admin-loading]')?.classList.toggle('d-none', !isLoading);
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderList(areas) {
  const tbody = document.querySelector('[data-admin-rows]');
  const cards = document.querySelector('[data-admin-cards]');
  const empty = document.querySelector('[data-admin-empty]');

  if (tbody) tbody.innerHTML = '';
  if (cards) cards.innerHTML = '';
  if (empty) empty.classList.toggle('d-none', areas.length !== 0);

  for (const a of areas) {
    const status = a.is_active ? 'Ativa' : 'Inativa';

    if (tbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="fw-semibold">${escapeHtml(a.name)}</div>
          <div class="text-secondary small">${escapeHtml(a.slug)}</div>
        </td>
        <td><span class="badge ${a.is_active ? 'text-bg-success' : 'text-bg-secondary'}">${status}</span></td>
        <td class="text-end">
          <button class="btn btn-outline-secondary btn-sm" type="button" data-admin-edit="${a.id}">
            <i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar
          </button>
          <button class="btn btn-outline-secondary btn-sm" type="button" data-admin-toggle="${a.id}" data-admin-toggle-value="${a.is_active ? 'false' : 'true'}">
            ${a.is_active ? 'Desativar' : 'Ativar'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    if (cards) {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-4 border';
      card.style.borderColor = 'var(--border)';
      card.style.background = 'var(--bg)';
      card.innerHTML = `
        <div class="d-flex flex-column justify-content-between gap-2">
          <div>
            <div class="fw-semibold">${escapeHtml(a.name)}</div>
            <div class="text-secondary small">${escapeHtml(a.slug)} </div>
            <span class="badge ${a.is_active ? 'text-bg-success' : 'text-bg-secondary'}">${status}</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm" type="button" data-admin-edit="${a.id}">Editar</button>
            <button class="btn btn-outline-secondary btn-sm" type="button" data-admin-toggle="${a.id}" data-admin-toggle-value="${a.is_active ? 'false' : 'true'}">
              ${a.is_active ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>
      `;
      cards.appendChild(card);
    }
  }
}

function setForm(form, area) {
  form.querySelector('[name="id"]').value = area?.id || '';
  form.querySelector('[name="name"]').value = area?.name || '';
  form.querySelector('[name="slug"]').value = area?.slug || '';
  form.querySelector('[name="description"]').value = area?.description || '';
  form.querySelector('[name="cover_image_url"]').value = area?.cover_image_url || '';
  form.querySelector('[name="is_active"]').checked = area ? Boolean(area.is_active) : true;

  const delBtn = document.querySelector('[data-admin-delete]');
  if (delBtn) delBtn.disabled = !area?.id;

  const uploadBtn = document.querySelector('[data-admin-upload-cover]');
  if (uploadBtn) uploadBtn.disabled = !area?.id;

  const preview = document.getElementById('area-cover-preview');
  if (preview) preview.src = area?.cover_image_url || '../assets/images/areas/placeholder.svg';
}

async function init() {
  await waitForLayoutReady();

  if (!requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/areas.html' })) return;

  try {
    const me = await getUserMe();
    if (me.role !== 'admin') {
      setAlert('Acesso restrito: admin somente.', 'warning');
      window.location.href = '../index.html';
      return;
    }
  } catch (err) {
    const status = err?.statusCode || err?.status || 0;
    if (status === 401) {
      clearSession();
      requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/areas.html' });
      return;
    }
    setAlert(err.message || 'Falha ao carregar sessão.', 'danger');
    return;
  }

  const form = document.getElementById('admin-area-form');
  const searchInput = document.querySelector('[data-admin-search]');

  let areas = [];
  let current = null;

  async function load() {
    setAlert(null);
    setLoading(true);
    try {
      const search = searchInput?.value?.trim() || null;
      areas = await getAdminAreas({ search });
      renderList(areas || []);
    } catch (err) {
      setAlert(err.message || 'Falha ao carregar áreas.', 'danger');
    } finally {
      setLoading(false);
    }
  }

  document.querySelector('[data-admin-refresh]')?.addEventListener('click', load);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void load();
    }
  });

  document.querySelector('[data-admin-clear]')?.addEventListener('click', () => {
    current = null;
    setForm(form, null);
    setAlert(null);
  });

  form?.querySelector('[name="name"]')?.addEventListener('input', () => {
    const slugInput = form.querySelector('[name="slug"]');
    if (!slugInput) return;
    if (slugInput.dataset.touched === 'true') return;
    slugInput.value = slugify(form.querySelector('[name="name"]').value);
  });

  form?.querySelector('[name="slug"]')?.addEventListener('input', (e) => {
    e.target.dataset.touched = 'true';
  });

  document.addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-admin-edit]')?.getAttribute('data-admin-edit');
    if (editId) {
      current = areas.find((a) => a.id === editId) || null;
      setForm(form, current);
      setAlert(null);
      return;
    }

    const toggleId = e.target.closest('[data-admin-toggle]')?.getAttribute('data-admin-toggle');
    if (toggleId) {
      const value = e.target.closest('[data-admin-toggle]')?.getAttribute('data-admin-toggle-value');
      const is_active = value === 'true';
      try {
        await toggleAreaActive(toggleId, is_active);
        setAlert('Status atualizado.', 'success');
        await load();
        if (current?.id === toggleId) {
          current = areas.find((a) => a.id === toggleId) || current;
          setForm(form, current);
        }
      } catch (err) {
        setAlert(err.message || 'Falha ao atualizar status.', 'danger');
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert(null);

    const id = form.querySelector('[name="id"]').value.trim();
    const name = form.querySelector('[name="name"]').value.trim();
    const slug = form.querySelector('[name="slug"]').value.trim();
    const description = form.querySelector('[name="description"]').value.trim() || null;
    const cover_image_url = form.querySelector('[name="cover_image_url"]').value.trim() || null;
    const is_active = Boolean(form.querySelector('[name="is_active"]').checked);

    const payload = { name, slug, description, cover_image_url, is_active };

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const saved = id ? await updateArea(id, payload) : await createArea(payload);
      setAlert('Área salva.', 'success');
      await load();
      current = areas.find((a) => a.id === saved.id) || saved;
      setForm(form, current);
    } catch (err) {
      setAlert(err.message || 'Falha ao salvar área.', 'danger');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  document.querySelector('[data-admin-delete]')?.addEventListener('click', async () => {
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    if (!id) return;
    if (!confirm('Excluir esta área?')) return;

    try {
      await deleteArea(id);
      setAlert('Área excluída.', 'success');
      current = null;
      setForm(form, null);
      await load();
    } catch (err) {
      setAlert(err.message || 'Falha ao excluir área.', 'danger');
    }
  });

  document.querySelector('[data-admin-upload-cover]')?.addEventListener('click', async () => {
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    const slug = form?.querySelector('[name="slug"]')?.value?.trim();
    if (!id || !slug) return;

    const file = document.getElementById('area-cover-file')?.files?.[0];
    if (!file) {
      setAlert('Selecione uma imagem.', 'warning');
      return;
    }

    try {
      setAlert(null);
      const btn = document.querySelector('[data-admin-upload-cover]');
      if (btn) btn.disabled = true;
      const res = await uploadAreaCover({ area_id: id, slug, file });
      setAlert('Capa enviada.', 'success');
      const updated = res.area || null;
      if (updated) {
        current = updated;
        setForm(form, current);
      } else {
        await load();
      }
      document.getElementById('area-cover-file').value = '';
    } catch (err) {
      setAlert(err.message || 'Falha ao enviar capa.', 'danger');
    } finally {
      const btn = document.querySelector('[data-admin-upload-cover]');
      if (btn) btn.disabled = !id;
    }
  });

  document.getElementById('area-cover-file')?.addEventListener('change', () => {
    const btn = document.querySelector('[data-admin-upload-cover]');
    if (!btn) return;
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    btn.disabled = !id;
  });

  setForm(form, null);
  await load();
}

void init();

