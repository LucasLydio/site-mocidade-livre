import { listPublishedEvents } from '../services/events.service.js';
import { setSafeImage, setText } from '../utils/dom.js';

const EVENT_PLACEHOLDER = 'assets/images/areas/placeholder.svg';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true }));
}

function toDate(value) {
  const date = new Date(String(value || ''));
  return Number.isFinite(date.getTime()) ? date : null;
}

const dateChipFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short'
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function formatDateChip(startsAt) {
  const start = toDate(startsAt);
  return start ? dateChipFormatter.format(start).replace('.', '') : 'Data a confirmar';
}

function formatDateTimeRange(startsAt, endsAt) {
  const start = toDate(startsAt);
  const end = toDate(endsAt);

  if (!start) return 'Data a confirmar';
  if (!end) return dateTimeFormatter.format(start);

  return `${dateTimeFormatter.format(start)} — ${dateTimeFormatter.format(end)}`;
}

function isUpcoming(event, now = Date.now()) {
  const start = toDate(event?.startsAt);
  return Boolean(start && start.getTime() >= now);
}

function closestUpcomingEvent(events) {
  return events
    .filter((event) => isUpcoming(event))
    .sort((a, b) => toDate(a.startsAt).getTime() - toDate(b.startsAt).getTime())[0] || null;
}

function eventDetailsHref(eventId) {
  const url = new URL('event-details.html', window.location.href);
  url.searchParams.set('id', eventId);
  return `${url.pathname}${url.search}`;
}

function setVisible(element, isVisible) {
  element?.classList.toggle('d-none', !isVisible);
}

function renderEvent(event) {
  const loading = document.querySelector('[data-home-upcoming-loading]');
  const empty = document.querySelector('[data-home-upcoming-empty]');
  const card = document.querySelector('[data-home-upcoming-card]');

  setVisible(loading, false);
  setVisible(empty, false);
  setVisible(card, true);

  if (!card) return;

  card.setAttribute('href', eventDetailsHref(event.id));
  card.setAttribute('aria-label', `Ver detalhes do evento ${event.title || 'Mocidade Livre'}`);

  setText(document.querySelector('[data-home-upcoming-date-chip]'), formatDateChip(event.startsAt));
  setText(document.querySelector('[data-home-upcoming-title]'), event.title || 'Evento da Mocidade Livre');
  setText(
    document.querySelector('[data-home-upcoming-summary]'),
    event.summary || 'Um encontro especial está chegando. Confira os detalhes e participe com a gente.'
  );
  setText(document.querySelector('[data-home-upcoming-datetime]'), formatDateTimeRange(event.startsAt, event.endsAt));

  const locationRow = document.querySelector('[data-home-upcoming-location-row]');
  const location = [event.locationName, event.locationAddress]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' • ');

  setVisible(locationRow, Boolean(location));
  setText(document.querySelector('[data-home-upcoming-location]'), location);

  setSafeImage(document.querySelector('[data-home-upcoming-cover]'), {
    src: event.coverImageUrl,
    fallback: EVENT_PLACEHOLDER,
    alt: event.title || 'Capa do próximo evento'
  });
}

function renderEmpty() {
  setVisible(document.querySelector('[data-home-upcoming-loading]'), false);
  setVisible(document.querySelector('[data-home-upcoming-card]'), false);
  setVisible(document.querySelector('[data-home-upcoming-empty]'), true);
}

async function loadUpcomingEvent() {
  const section = document.querySelector('[data-home-upcoming-section]');
  if (!section) return;

  setVisible(document.querySelector('[data-home-upcoming-loading]'), true);
  setVisible(document.querySelector('[data-home-upcoming-card]'), false);
  setVisible(document.querySelector('[data-home-upcoming-empty]'), false);

  try {
    const result = await listPublishedEvents({ limit: 100 });
    const events = Array.isArray(result) ? result : [];
    const event = closestUpcomingEvent(events);

    if (event) {
      renderEvent(event);
    } else {
      renderEmpty();
    }
  } catch {
    renderEmpty();
  }
}

async function init() {
  await waitForLayoutReady();
  await loadUpcomingEvent();
}

void init();
