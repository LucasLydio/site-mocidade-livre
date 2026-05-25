import { CONTACT_CONFIG } from '../core/config.js';
import { getActiveAreas } from '../services/areas.service.js';
import { createContactInterest } from '../services/contact.service.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('mocidade:layout-ready', resolve, { once: true }));
}

function setAlert(message, type = 'danger') {
  const el = document.querySelector('[data-contact-alert]');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function setSuccess(message) {
  const el = document.querySelector('[data-contact-success]');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = 'alert alert-success';
  el.textContent = message;
}

function setLoading(isLoading) {
  document.querySelector('[data-contact-loading]')?.classList.toggle('d-none', !isLoading);
  document.querySelector('[data-contact-submit]')?.toggleAttribute('disabled', isLoading);
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

function applyContactOptions() {
  const whatsappAnchor = document.querySelector('[data-contact-whatsapp]');
  const emailAnchor = document.querySelector('[data-contact-email]');

  const whatsapp = buildWhatsAppLink(CONTACT_CONFIG?.whatsappNumber, 'Olá! Quero falar com a Mocidade Livre.');
  const mailto = buildMailtoLink(CONTACT_CONFIG?.email, {
    subject: 'Contato — Mocidade Livre',
    body: 'Olá! Quero falar com a Mocidade Livre.',
  });

  if (whatsappAnchor) {
    if (whatsapp) {
      whatsappAnchor.setAttribute('href', whatsapp);
      whatsappAnchor.classList.remove('disabled');
      whatsappAnchor.removeAttribute('aria-disabled');
      whatsappAnchor.removeAttribute('tabindex');
    } else {
      whatsappAnchor.setAttribute('href', '#');
      whatsappAnchor.classList.add('disabled');
      whatsappAnchor.setAttribute('aria-disabled', 'true');
      whatsappAnchor.setAttribute('tabindex', '-1');
    }
  }

  if (emailAnchor) {
    if (mailto) {
      emailAnchor.setAttribute('href', mailto);
      emailAnchor.classList.remove('disabled');
      emailAnchor.removeAttribute('aria-disabled');
      emailAnchor.removeAttribute('tabindex');
    } else {
      emailAnchor.setAttribute('href', '#');
      emailAnchor.classList.add('disabled');
      emailAnchor.setAttribute('aria-disabled', 'true');
      emailAnchor.setAttribute('tabindex', '-1');
    }
  }
}

async function hydrateAreaOptions() {
  const select = document.getElementById('join-area');
  if (!select) return;

  try {
    const areas = await getActiveAreas();
    const list = Array.isArray(areas) ? areas : [];

    const existing = new Set(Array.from(select.querySelectorAll('option')).map((o) => String(o.value || '')));
    for (const a of list) {
      const value = String(a?.slug || '').trim();
      const label = String(a?.name || '').trim();
      if (!value || !label) continue;
      if (existing.has(value)) continue;
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      select.appendChild(opt);
      existing.add(value);
    }
  } catch {
    // Keep fallback options
  }
}

async function init() {
  await waitForLayoutReady();

  applyContactOptions();
  await hydrateAreaOptions();

  const form = document.getElementById('join-form');
  if (!form) return;

  setAlert(null);
  setSuccess(null);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    setAlert(null);
    setSuccess(null);

    const name = form.querySelector('[name="name"]')?.value?.trim() || '';
    const whatsapp = form.querySelector('[name="whatsapp"]')?.value?.trim() || '';
    const email = form.querySelector('[name="email"]')?.value?.trim() || null;
    const area_interest = form.querySelector('[name="area_interest"]')?.value?.trim() || '';
    const message = form.querySelector('[name="message"]')?.value?.trim() || null;

    if (!name) {
      setAlert('Informe seu nome.', 'warning');
      return;
    }
    if (!whatsapp) {
      setAlert('Informe seu WhatsApp.', 'warning');
      return;
    }
    if (!area_interest) {
      setAlert('Selecione uma área de interesse.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await createContactInterest({ name, whatsapp, email, area_interest, message });
      setSuccess('Interesse enviado! Em breve a gente te chama.');
      form.reset();
    } catch (err) {
      setAlert(err.message || 'Falha ao enviar interesse.', 'danger');
    } finally {
      setLoading(false);
    }
  });
}

void init();
