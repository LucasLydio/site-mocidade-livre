import { clearSession, requireAuthRedirect } from '../../core/session.js';
import { getMe as getUserMe } from '../../services/user.service.js';
import { createEvent, deleteEvent, listAdminEvents, toggleEventPublished, updateEvent, uploadEventCover } from '../../services/events.service.js';

function waitForLayoutReady() { return window.__mocidadeLayoutReady ? Promise.resolve() : new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true })); }
function setAlert(message, type = 'danger') { const el = document.getElementById('admin-alert'); if (!el) return; if (!message) { el.className = 'alert d-none'; el.textContent = ''; return; } el.className = `alert alert-${type}`; el.textContent = message; }

function setLoading(isLoading) { document.querySelector('[data-admin-loading]')?.classList.toggle('d-none', !isLoading); }

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toDate(value) { const d = new Date(String(value || '')); return Number.isFinite(d.getTime()) ? d : null; }

const PLACEHOLDER_COVER = '../assets/images/areas/placeholder.svg';

function setCoverPreview(url, title) { const img = document.getElementById('event-cover-preview'); if (!img) return; img.src = url || PLACEHOLDER_COVER; img.alt = title || 'Capa do evento'; }

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toLocalDatetimeValue(iso) {
  const d = toDate(iso);
  if (!d) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fromLocalDatetimeValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

const fmtDateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

let events = [];
let current = null;

function setForm(form, ev) {
  form.querySelector('[name="id"]').value = ev?.id || '';
  form.querySelector('[name="title"]').value = ev?.title || '';
  form.querySelector('[name="summary"]').value = ev?.summary || '';
  form.querySelector('[name="description"]').value = ev?.description || '';
  form.querySelector('[name="starts_at"]').value = toLocalDatetimeValue(ev?.starts_at);
  form.querySelector('[name="ends_at"]').value = toLocalDatetimeValue(ev?.ends_at);
  form.querySelector('[name="location_name"]').value = ev?.location_name || '';
  form.querySelector('[name="location_address"]').value = ev?.location_address || '';
  form.querySelector('[name="cover_image_url"]').value = ev?.cover_image_url || '';
  form.querySelector('[name="is_published"]').checked = Boolean(ev?.is_published);

  setCoverPreview(ev?.cover_image_url, ev?.title);

  document.querySelector('[data-admin-delete]')?.toggleAttribute('disabled', !ev?.id);

  const uploadBtn = document.querySelector('[data-admin-upload-cover]');
  const hasFile = Boolean(document.getElementById('event-cover-file')?.files?.[0]);
  if (uploadBtn) uploadBtn.disabled = !ev?.id || !hasFile;
}

function renderList(items) {
  const root = document.querySelector('[data-admin-events-cards]');
  const empty = document.querySelector('[data-admin-empty]');
  if (root) root.innerHTML = '';
  if (empty) empty.classList.toggle('d-none', items.length !== 0);

  for (const ev of items) {
    const start = toDate(ev.starts_at);
    const dateLabel = start ? fmtDateTime.format(start) : '';

    const statusLabel = ev.is_published ? 'Publicado' : 'Rascunho';
    const badgeClass = ev.is_published ? 'text-bg-success' : 'text-bg-secondary';
    const toggleLabel = ev.is_published ? 'Despublicar' : 'Publicar';
    const nextValue = ev.is_published ? 'false' : 'true';

    const card = document.createElement('div');
    card.className = 'p-3 rounded-4 border';
    card.style.borderColor = 'var(--border)';
    card.style.background = 'var(--surface)';
    const summaryHtml = ev.summary ? `<div class="text-secondary small">${escapeHtml(ev.summary)}</div>` : '<div class="text-secondary small">Sem resumo.</div>';
    const viewHref = `../event-details.html?id=${encodeURIComponent(ev.id)}`;
    const viewAttrs = ev.is_published ? '' : 'disabled tabindex="-1" aria-disabled="true"';
    card.innerHTML = `<div class="d-flex flex-column gap-2"><div class="d-flex justify-content-between align-items-start gap-2"><div><div class="fw-semibold">${escapeHtml(ev.title)}</div><div class="text-secondary small">${escapeHtml(
      dateLabel,
    )}</div></div><span class="badge ${badgeClass}">${statusLabel}</span></div>${summaryHtml}<div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-secondary btn-sm" type="button" data-admin-edit="${escapeHtml(ev.id)}"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar</button><button class="btn btn-outline-secondary btn-sm" type="button" data-admin-toggle-published="${escapeHtml(ev.id)}" data-admin-toggle-published-value="${nextValue}">${toggleLabel}</button><a class="btn btn-outline-secondary btn-sm ${ev.is_published ? '' : 'disabled'}" href="${viewHref}" ${viewAttrs}><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver</a></div></div>`;

    root?.appendChild(card);
  }
}

async function ensureAdminSession() {
  if (!requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/events.html' })) return false;

  try {
    const me = await getUserMe();
    if (me.role !== 'admin') {
      setAlert('Acesso restrito: admin somente.', 'warning');
      window.location.href = '../index.html';
      return false;
    }
    return true;
  } catch (err) {
    const status = err?.statusCode || err?.status || 0;
    if (status === 401) {
      clearSession();
      requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/events.html' });
      return false;
    }
    setAlert(err.message || 'Falha ao carregar sessão.', 'danger');
    return false;
  }
}

async function load() {
  const search = document.querySelector('[data-admin-search]')?.value?.trim() || null;
  setLoading(true);
  setAlert(null);
  try {
    const result = await listAdminEvents({ search, limit: 200, offset: 0, status: 'all' });
    events = Array.isArray(result?.items) ? result.items : [];
    events.sort((a, b) => (toDate(a.starts_at) || 0) - (toDate(b.starts_at) || 0));
    renderList(events);
  } catch (err) {
    setAlert(err.message || 'Falha ao carregar eventos.', 'danger');
  } finally {
    setLoading(false);
  }
}

async function init() {
  await waitForLayoutReady();

  const ok = await ensureAdminSession();
  if (!ok) return;

  const form = document.getElementById('admin-event-form');
  const searchInput = document.querySelector('[data-admin-search]');
  const fileInput = document.getElementById('event-cover-file');

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
    if (fileInput) fileInput.value = '';
  });

  document.addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-admin-edit]')?.getAttribute('data-admin-edit');
    if (editId) {
      current = events.find((it) => it.id === editId) || null;
      setForm(form, current);
      setAlert(null);
      return;
    }

    const toggleId = e.target.closest('[data-admin-toggle-published]')?.getAttribute('data-admin-toggle-published');
    if (toggleId) {
      const value = e.target.closest('[data-admin-toggle-published]')?.getAttribute('data-admin-toggle-published-value');
      const is_published = value === 'true';
      try {
        await toggleEventPublished(toggleId, is_published);
        setAlert('Status atualizado.', 'success');
        await load();
        if (current?.id === toggleId) {
          current = events.find((it) => it.id === toggleId) || current;
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
    const title = form.querySelector('[name="title"]').value.trim();
    const summary = form.querySelector('[name="summary"]').value.trim() || null;
    const description = form.querySelector('[name="description"]').value.trim() || null;
    const starts_at = fromLocalDatetimeValue(form.querySelector('[name="starts_at"]').value);
    const ends_at = fromLocalDatetimeValue(form.querySelector('[name="ends_at"]').value);
    const location_name = form.querySelector('[name="location_name"]').value.trim() || null;
    const location_address = form.querySelector('[name="location_address"]').value.trim() || null;
    const cover_image_url = form.querySelector('[name="cover_image_url"]').value.trim() || null;
    const is_published = Boolean(form.querySelector('[name="is_published"]').checked);

    if (!title) {
      setAlert('Título é obrigatório.', 'warning');
      return;
    }

    if (!starts_at) {
      setAlert('Data/hora de início é obrigatória.', 'warning');
      return;
    }

    const payload = {
      title,
      summary,
      description,
      starts_at,
      ends_at,
      location_name,
      location_address,
      cover_image_url,
      is_published,
    };

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const saved = id ? await updateEvent(id, payload) : await createEvent(payload);
      setAlert('Evento salvo.', 'success');
      await load();
      current = events.find((it) => it.id === saved.id) || saved;
      setForm(form, current);
    } catch (err) {
      setAlert(err.message || 'Falha ao salvar evento.', 'danger');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  document.querySelector('[data-admin-upload-cover]')?.addEventListener('click', async () => {
    const event_id = form?.querySelector('[name="id"]')?.value?.trim();
    if (!event_id) return;

    const file = fileInput?.files?.[0];
    if (!file) {
      setAlert('Selecione uma imagem.', 'warning');
      return;
    }

    try {
      setAlert(null);
      const btn = document.querySelector('[data-admin-upload-cover]');
      if (btn) btn.disabled = true;
      const res = await uploadEventCover({ event_id, file });
      setAlert('Capa enviada.', 'success');
      const updated = res.event || null;
      if (updated) {
        current = updated;
        setForm(form, current);
      } else {
        await load();
      }
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setAlert(err.message || 'Falha ao enviar capa.', 'danger');
    } finally {
      const btn = document.querySelector('[data-admin-upload-cover]');
      const id = form?.querySelector('[name="id"]')?.value?.trim();
      if (btn) btn.disabled = !id;
    }
  });

  fileInput?.addEventListener('change', () => {
    const btn = document.querySelector('[data-admin-upload-cover]');
    if (!btn) return;
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    btn.disabled = !id || !fileInput?.files?.[0];
  });

  document.querySelector('[data-admin-delete]')?.addEventListener('click', async () => {
    const id = form?.querySelector('[name="id"]')?.value?.trim();
    if (!id) return;
    if (!confirm('Excluir este evento?')) return;

    try {
      await deleteEvent(id);
      setAlert('Evento excluído.', 'success');
      current = null;
      setForm(form, null);
      await load();
    } catch (err) {
      setAlert(err.message || 'Falha ao excluir evento.', 'danger');
    }
  });

  setForm(form, null);
  await load();
}

void init();
