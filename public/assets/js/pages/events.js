import { listPublishedEvents } from '../services/events.service.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true }));
}

function setAlert(message, type = 'danger') {
  const el = document.querySelector('[data-events-alert]');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function toDate(value) {
  const d = new Date(String(value || ''));
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

const fmtDateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatRange(startsAt, endsAt) {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (!start) return '';
  if (!end) return fmtDateTime.format(start);
  return `${fmtDateTime.format(start)} — ${fmtDateTime.format(end)}`;
}

function isUpcoming(event, nowMs) {
  const start = toDate(event?.starts_at);
  if (!start) return false;
  return start.getTime() >= nowMs;
}

function setCover(img, { url, title }) {
  if (!img) return;
  img.src = url || 'assets/images/areas/placeholder.svg';
  img.alt = title || 'Capa do evento';
}

function renderCards({ upcoming = [], past = [] } = {}) {
  const loading = document.querySelector('[data-events-loading]');
  const empty = document.querySelector('[data-events-empty]');
  const upcomingSection = document.querySelector('[data-events-upcoming-section]');
  const pastSection = document.querySelector('[data-events-past-section]');
  const upcomingGrid = document.querySelector('[data-events-upcoming]');
  const pastGrid = document.querySelector('[data-events-past]');

  if (loading) loading.classList.add('d-none');
  if (upcomingGrid) upcomingGrid.innerHTML = '';
  if (pastGrid) pastGrid.innerHTML = '';

  const hasAny = upcoming.length + past.length > 0;
  if (empty) empty.classList.toggle('d-none', hasAny);

  if (upcomingSection) upcomingSection.classList.toggle('d-none', upcoming.length === 0);
  if (pastSection) pastSection.classList.toggle('d-none', past.length === 0);

  const tpl = document.getElementById('event-card-template');
  const createNode = () =>
    tpl?.content?.firstElementChild ? tpl.content.firstElementChild.cloneNode(true) : document.createElement('div');

  const writeCard = (node, ev, { badgeText, badgeClass }) => {
    const a = node.querySelector('[data-event-link]');
    if (a) {
      const url = new URL('event-details.html', window.location.href);
      url.searchParams.set('id', ev.id);
      a.setAttribute('href', url.pathname + url.search);
    }

    node.querySelector('[data-event-title]')?.append(ev.title || '');
    node.querySelector('[data-event-summary]')?.append(ev.summary || '');
    node.querySelector('[data-event-datetime]')?.append(formatRange(ev.starts_at, ev.ends_at));

    const badge = node.querySelector('[data-event-badge]');
    if (badge) {
      badge.textContent = badgeText;
      badge.className = `badge ${badgeClass}`;
    }

    const locRow = node.querySelector('[data-event-location-row]');
    const loc = String(ev.location_name || '').trim();
    const addr = String(ev.location_address || '').trim();
    if (locRow) locRow.classList.toggle('d-none', !loc && !addr);
    node.querySelector('[data-event-location]')?.append(loc || 'Local a confirmar');
    node.querySelector('[data-event-address]')?.append(addr || '');

    setCover(node.querySelector('[data-event-cover]'), { url: ev.cover_image_url, title: ev.title });
  };

  for (const ev of upcoming) {
    const node = createNode();
    writeCard(node, ev, { badgeText: 'Próximo', badgeClass: 'text-bg-success' });
    upcomingGrid?.appendChild(node);
  }

  for (const ev of past) {
    const node = createNode();
    writeCard(node, ev, { badgeText: 'Passado', badgeClass: 'text-bg-secondary' });
    pastGrid?.appendChild(node);
  }
}

async function load({ search } = {}) {
  setAlert(null);
  document.querySelector('[data-events-loading]')?.classList.remove('d-none');
  document.querySelector('[data-events-empty]')?.classList.add('d-none');
  document.querySelector('[data-events-upcoming-section]')?.classList.add('d-none');
  document.querySelector('[data-events-past-section]')?.classList.add('d-none');

  try {
    const result = await listPublishedEvents({ search: search || null, limit: 200, offset: 0, status: 'all' });
    const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : [];

    const nowMs = Date.now();
    const upcoming = items.filter((e) => isUpcoming(e, nowMs)).sort((a, b) => toDate(a.starts_at) - toDate(b.starts_at));
    const past = items.filter((e) => !isUpcoming(e, nowMs)).sort((a, b) => toDate(b.starts_at) - toDate(a.starts_at));

    renderCards({ upcoming, past });
  } catch (err) {
    document.querySelector('[data-events-loading]')?.classList.add('d-none');
    setAlert(err.message || 'Falha ao carregar eventos.', 'danger');
  }
}

function debounce(fn, ms = 350) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function init() {
  await waitForLayoutReady();

  const searchInput = document.querySelector('[data-events-search]');
  const initialSearch = new URLSearchParams(window.location.search).get('search') || '';
  if (searchInput) searchInput.value = initialSearch;

  const run = debounce(() => {
    const value = searchInput?.value?.trim() || '';
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('search', value);
    else url.searchParams.delete('search');
    window.history.replaceState({}, '', url.toString());
    void load({ search: value });
  }, 350);

  searchInput?.addEventListener('input', run);

  await load({ search: initialSearch });
}

void init();

