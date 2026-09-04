import { clearSession, requireAuthRedirect } from '../../core/session.js';
import { getMe } from '../../services/user.service.js';
import { deleteStorageFiles, listStorageFiles } from '../../services/storage.service.js';
import { clearElement, setSafeImage, setText } from '../../utils/dom.js';

const PLACEHOLDER = '../assets/images/areas/placeholder.svg';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true }));
}

function setAlert(message, type = 'danger') {
  const el = document.getElementById('storage-alert');
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
  document.querySelector('[data-storage-loading]')?.classList.toggle('d-none', !isLoading);
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value) {
  const date = new Date(String(value || ''));
  if (!Number.isFinite(date.getTime())) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function statusBadge(file) {
  const badge = document.createElement('span');
  badge.className = `badge ${file.isUsed ? 'text-bg-success' : 'text-bg-warning'}`;
  badge.textContent = file.isUsed ? 'Usada' : 'Não usada';
  return badge;
}

function usageLabel(usage) {
  const typeLabel = {
    area: 'Área',
    event: 'Evento',
    product_image: 'Produto'
  }[usage.type] || 'Uso';

  return `${typeLabel}: ${usage.label}`;
}

function visibleFiles(files) {
  const filter = document.querySelector('[data-storage-filter]')?.value || 'all';
  const search = document.querySelector('[data-storage-search]')?.value?.trim().toLocaleLowerCase('pt-BR') || '';

  return files.filter((file) => {
    if (filter === 'used' && !file.isUsed) return false;
    if (filter === 'unused' && file.isUsed) return false;
    if (!search) return true;

    const haystack = `${file.path} ${file.contentType || ''} ${file.usedBy?.map(usageLabel).join(' ') || ''}`.toLocaleLowerCase('pt-BR');
    return haystack.includes(search);
  });
}

async function ensureAdminSession() {
  if (!requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/storage.html' })) return false;

  try {
    const me = await getMe();
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
      requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/storage.html' });
      return false;
    }

    setAlert(err.message || 'Falha ao carregar sessão.', 'danger');
    return false;
  }
}

let state = {
  files: [],
  selected: new Set()
};

function syncSelectionUi() {
  const selectedFiles = state.files.filter((file) => state.selected.has(file.path));
  const totalBytes = selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const deleteBtn = document.querySelector('[data-storage-delete-selected]');

  setText(
    document.querySelector('[data-storage-selection]'),
    `${selectedFiles.length} imagem(ns) selecionada(s). Espaço selecionado: ${formatBytes(totalBytes)}.`
  );

  if (deleteBtn) deleteBtn.disabled = selectedFiles.length === 0;

  document.querySelectorAll('[data-storage-checkbox]').forEach((checkbox) => {
    checkbox.checked = state.selected.has(checkbox.value);
  });
}

function renderSummary(summary = {}) {
  setText(document.querySelector('[data-storage-total]'), summary.total ?? 0);
  setText(document.querySelector('[data-storage-used]'), summary.used ?? 0);
  setText(document.querySelector('[data-storage-unused]'), summary.unused ?? 0);
  setText(document.querySelector('[data-storage-unused-size]'), formatBytes(summary.unusedBytes));
}

function renderFile(file) {
  const card = document.createElement('article');
  card.className = 'storage-file rounded-4 border';

  const preview = document.createElement('div');
  preview.className = 'storage-file-preview';

  const checkbox = document.createElement('input');
  checkbox.className = 'form-check-input storage-file-checkbox';
  checkbox.type = 'checkbox';
  checkbox.value = file.path;
  checkbox.disabled = Boolean(file.isUsed);
  checkbox.setAttribute('data-storage-checkbox', 'true');
  checkbox.setAttribute('aria-label', `Selecionar ${file.path}`);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) state.selected.add(file.path);
    else state.selected.delete(file.path);
    syncSelectionUi();
  });

  const img = document.createElement('img');
  setSafeImage(img, {
    src: file.publicUrl,
    fallback: PLACEHOLDER,
    alt: file.name || 'Imagem do storage'
  });
  img.loading = 'lazy';

  preview.append(checkbox, img);

  const body = document.createElement('div');
  body.className = 'p-3';

  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-start gap-2 mb-2';

  const path = document.createElement('div');
  path.className = 'fw-semibold small storage-file-path';
  path.textContent = file.path;

  header.append(path, statusBadge(file));

  const meta = document.createElement('div');
  meta.className = 'text-secondary small d-flex flex-column gap-1';

  const size = document.createElement('div');
  size.textContent = `Tamanho: ${formatBytes(file.size)}`;
  const updated = document.createElement('div');
  updated.textContent = `Atualizado: ${formatDate(file.updatedAt || file.createdAt)}`;
  meta.append(size, updated);

  if (file.usedBy?.length) {
    const usage = document.createElement('div');
    usage.className = 'storage-used-list mt-2 small';
    for (const item of file.usedBy) {
      const row = document.createElement('div');
      row.textContent = usageLabel(item);
      usage.appendChild(row);
    }
    meta.appendChild(usage);
  }

  const actions = document.createElement('div');
  actions.className = 'd-flex gap-2 mt-3';

  const open = document.createElement('a');
  open.className = 'btn btn-outline-secondary btn-sm';
  open.href = file.publicUrl;
  open.target = '_blank';
  open.rel = 'noopener';
  open.textContent = 'Ver';

  actions.appendChild(open);
  body.append(header, meta, actions);
  card.append(preview, body);

  return card;
}

function renderFiles() {
  const grid = document.querySelector('[data-storage-grid]');
  const empty = document.querySelector('[data-storage-empty]');
  if (!grid) return;

  const files = visibleFiles(state.files);
  const visiblePaths = new Set(files.map((file) => file.path));
  state.selected = new Set(Array.from(state.selected).filter((path) => visiblePaths.has(path)));

  clearElement(grid);
  for (const file of files) {
    grid.appendChild(renderFile(file));
  }

  grid.classList.toggle('d-none', files.length === 0);
  empty?.classList.toggle('d-none', files.length !== 0);
  syncSelectionUi();
}

async function loadFiles() {
  setAlert(null);
  setLoading(true);

  try {
    const result = await listStorageFiles();
    state.files = Array.isArray(result.files) ? result.files : [];
    state.selected.clear();
    renderSummary(result.summary || {});
    renderFiles();
  } catch (err) {
    renderSummary({});
    state.files = [];
    state.selected.clear();
    renderFiles();
    setAlert(err.message || 'Falha ao carregar imagens do storage.', 'danger');
  } finally {
    setLoading(false);
  }
}

async function deleteSelected() {
  const paths = Array.from(state.selected);
  if (paths.length === 0) return;

  const confirmed = confirm(`Excluir ${paths.length} imagem(ns) não usada(s)? Essa ação não pode ser desfeita.`);
  if (!confirmed) return;

  const btn = document.querySelector('[data-storage-delete-selected]');
  if (btn) btn.disabled = true;

  try {
    const result = await deleteStorageFiles(paths);
    const deleted = result.deleted?.length || 0;
    const skipped = result.skipped?.length || 0;
    setAlert(`Limpeza concluída. Excluídas: ${deleted}. Ignoradas: ${skipped}.`, skipped ? 'warning' : 'success');
    await loadFiles();
  } catch (err) {
    setAlert(err.message || 'Falha ao excluir imagens.', 'danger');
    syncSelectionUi();
  }
}

async function init() {
  await waitForLayoutReady();

  if (!await ensureAdminSession()) return;

  document.querySelector('[data-storage-refresh]')?.addEventListener('click', loadFiles);
  document.querySelector('[data-storage-filter]')?.addEventListener('change', renderFiles);
  document.querySelector('[data-storage-search]')?.addEventListener('input', renderFiles);
  document.querySelector('[data-storage-delete-selected]')?.addEventListener('click', deleteSelected);
  document.querySelector('[data-storage-select-unused]')?.addEventListener('click', () => {
    state.selected = new Set(visibleFiles(state.files).filter((file) => !file.isUsed).map((file) => file.path));
    syncSelectionUi();
  });

  await loadFiles();
}

void init();
