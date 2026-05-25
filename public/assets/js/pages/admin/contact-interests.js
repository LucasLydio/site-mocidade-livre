import { clearSession, requireAuthRedirect } from '../../core/session.js';
import { getMe as getUserMe } from '../../services/user.service.js';
import { deleteContactInterest, listContactInterests, updateContactInterestStatus } from '../../services/contact.service.js';

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

function setLoading(isLoading) { document.querySelector('[data-admin-loading]')?.classList.toggle('d-none', !isLoading); }

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function sanitizePhoneNumber(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function buildWhatsAppLink(number, text) {
  const digits = sanitizePhoneNumber(number);
  if (!digits) return null;
  const url = new URL(`https://wa.me/${digits}`);
  if (text) url.searchParams.set('text', text);
  return url.toString();
}

function buildMailtoLink(email, { subject, body } = {}) {
  const value = String(email || '').trim();
  if (!value) return null;
  const url = new URL(`mailto:${value}`);
  if (subject) url.searchParams.set('subject', subject);
  if (body) url.searchParams.set('body', body);
  return url.toString();
}

function toDate(value) { const d = new Date(String(value || '')); return Number.isFinite(d.getTime()) ? d : null; }

const fmtDateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

let items = [];

function statusBadge(status) {
  if (status === 'new') return { label: 'Novo', cls: 'text-bg-primary' };
  if (status === 'contacted') return { label: 'Contactado', cls: 'text-bg-success' };
  return { label: 'Arquivado', cls: 'text-bg-secondary' };
}

function renderList(list) {
  const root = document.querySelector('[data-admin-cards]');
  const empty = document.querySelector('[data-admin-empty]');
  if (root) root.innerHTML = '';
  if (empty) empty.classList.toggle('d-none', list.length !== 0);

  for (const it of list) {
    const created = toDate(it.created_at);
    const createdLabel = created ? fmtDateTime.format(created) : '';
    const badge = statusBadge(it.status);

    const whatsappLink = buildWhatsAppLink(it.whatsapp, `Olá, ${it.name}! Aqui é da Mocidade Livre.`);
    const mailto = buildMailtoLink(it.email, { subject: 'Contato — Mocidade Livre' });

    const messagePreview = String(it.message || '').trim();
    const preview = messagePreview.length > 140 ? `${messagePreview.slice(0, 140)}…` : messagePreview;

    const card = document.createElement('div');
    card.className = 'p-3 rounded-4 border';
    card.style.borderColor = 'var(--border)';
    card.style.background = 'var(--surface)';

    const actions = [];
    if (it.status !== 'contacted') actions.push(`<button class="btn btn-outline-secondary btn-sm" type="button" data-admin-set-status="${escapeHtml(it.id)}" data-admin-set-status-value="contacted">Marcar contactado</button>`);
    if (it.status !== 'archived') actions.push(`<button class="btn btn-outline-secondary btn-sm" type="button" data-admin-set-status="${escapeHtml(it.id)}" data-admin-set-status-value="archived">Arquivar</button>`);
    if (it.status !== 'new') actions.push(`<button class="btn btn-outline-secondary btn-sm" type="button" data-admin-set-status="${escapeHtml(it.id)}" data-admin-set-status-value="new">Reabrir</button>`);

    if (whatsappLink) actions.push(`<a class="btn btn-dark btn-sm" href="${whatsappLink}" target="_blank" rel="noopener"><i class="bi bi-whatsapp me-1" aria-hidden="true"></i>WhatsApp</a>`);
    if (mailto) actions.push(`<a class="btn btn-outline-secondary btn-sm" href="${mailto}"><i class="bi bi-envelope me-1" aria-hidden="true"></i>Email</a>`);
    actions.push(`<button class="btn btn-outline-danger btn-sm" type="button" data-admin-delete="${escapeHtml(it.id)}"><i class="bi bi-trash me-1" aria-hidden="true"></i>Excluir</button>`);

    card.innerHTML = `<div class="d-flex flex-column gap-2"><div class="d-flex justify-content-between align-items-start gap-2"><div><div class="fw-semibold">${escapeHtml(
      it.name,
    )}</div><div class="text-secondary small">${escapeHtml(it.area_interest || '')}${createdLabel ? ` • ${escapeHtml(createdLabel)}` : ''}</div></div><span class="badge ${badge.cls}">${badge.label}</span></div><div class="text-secondary small">${escapeHtml(
      it.whatsapp || '',
    )}${it.email ? ` • ${escapeHtml(it.email)}` : ''}</div>${preview ? `<div class="small" style="white-space: pre-wrap">${escapeHtml(preview)}</div>` : '<div class="text-secondary small">Sem mensagem.</div>'}<div class="d-flex flex-wrap gap-2">${actions.join(
      '',
    )}</div></div>`;

    root?.appendChild(card);
  }
}

async function ensureAdminSession() {
  if (!requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/contact-interests.html' })) return false;

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
      requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/contact-interests.html' });
      return false;
    }
    setAlert(err.message || 'Falha ao carregar sessão.', 'danger');
    return false;
  }
}

async function load() {
  const status = document.querySelector('[data-admin-filter-status]')?.value || 'all';
  const search = document.querySelector('[data-admin-search]')?.value?.trim() || null;

  setLoading(true);
  setAlert(null);
  try {
    const res = await listContactInterests({ status, search, limit: 100, offset: 0 });
    items = Array.isArray(res?.items) ? res.items : [];
    renderList(items);
  } catch (err) {
    setAlert(err.message || 'Falha ao carregar interesses.', 'danger');
  } finally {
    setLoading(false);
  }
}

async function init() {
  await waitForLayoutReady();

  const ok = await ensureAdminSession();
  if (!ok) return;

  document.querySelector('[data-admin-refresh]')?.addEventListener('click', load);
  document.querySelector('[data-admin-filter-status]')?.addEventListener('change', load);
  document.querySelector('[data-admin-search]')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void load();
    }
  });

  document.addEventListener('click', async (e) => {
    const statusBtn = e.target.closest('[data-admin-set-status]');
    if (statusBtn) {
      const id = statusBtn.getAttribute('data-admin-set-status');
      const next = statusBtn.getAttribute('data-admin-set-status-value');
      if (!id || !next) return;

      try {
        await updateContactInterestStatus(id, next);
        setAlert('Status atualizado.', 'success');
        await load();
      } catch (err) {
        setAlert(err.message || 'Falha ao atualizar status.', 'danger');
      }
      return;
    }

    const deleteId = e.target.closest('[data-admin-delete]')?.getAttribute('data-admin-delete');
    if (deleteId) {
      if (!confirm('Excluir este interesse?')) return;
      try {
        await deleteContactInterest(deleteId);
        setAlert('Interesse excluído.', 'success');
        await load();
      } catch (err) {
        setAlert(err.message || 'Falha ao excluir interesse.', 'danger');
      }
    }
  });

  await load();
}

void init();
