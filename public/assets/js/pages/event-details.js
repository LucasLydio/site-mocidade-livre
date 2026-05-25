import { getPublishedEventById } from '../services/events.service.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true }));
}

function toDate(value) {
  const d = new Date(String(value || ''));
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

const fmtDateTime = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
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

function setText(sel, value) {
  const el = document.querySelector(sel);
  if (!el) return;
  el.textContent = String(value || '');
}

function setAlert(message, type = 'danger') {
  const el = document.getElementById('event-alert');
  if (!el) return;
  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }
  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function setCover(url, title) {
  const img = document.getElementById('event-cover');
  if (!img) return;
  img.src = url || 'assets/images/areas/placeholder.svg';
  img.alt = title || 'Capa do evento';
}

async function init() {
  await waitForLayoutReady();

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    setAlert('Evento não encontrado.', 'warning');
    document.querySelector('[data-event-loading]')?.classList.add('d-none');
    return;
  }

  setAlert(null);

  try {
    const ev = await getPublishedEventById(id);

    setText('[data-event-title]', ev.title || 'Evento');
    setText('[data-event-summary]', ev.summary || '');
    setText('[data-event-description]', ev.description || '');
    setText('[data-event-datetime]', formatRange(ev.starts_at, ev.ends_at));

    const loc = String(ev.location_name || '').trim();
    const addr = String(ev.location_address || '').trim();
    document.querySelector('[data-event-location-row]')?.classList.toggle('d-none', !loc && !addr);
    setText('[data-event-location]', loc || 'Local a confirmar');
    setText('[data-event-address]', addr || '');

    setCover(ev.cover_image_url, ev.title);

    document.querySelector('[data-event-loading]')?.classList.add('d-none');
    document.querySelector('[data-event-content]')?.classList.remove('d-none');
  } catch (err) {
    document.querySelector('[data-event-loading]')?.classList.add('d-none');
    setAlert(err.message || 'Falha ao carregar evento.', 'danger');
  }
}

void init();

