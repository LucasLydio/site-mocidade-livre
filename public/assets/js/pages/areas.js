import { getActiveAreas } from '../services/areas.service.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener('mocidade:layout-ready', resolve, { once: true });
  });
}

function setAlert(message, type = 'danger') {
  const el = document.querySelector('[data-areas-alert]');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function renderAreas(areas) {
  const grid = document.querySelector('[data-areas-grid]');
  const empty = document.querySelector('[data-areas-empty]');
  const loading = document.querySelector('[data-areas-loading]');

  if (loading) loading.classList.add('d-none');
  if (!grid) return;

  grid.innerHTML = '';

  const items = Array.isArray(areas) ? areas : [];
  if (empty) empty.classList.toggle('d-none', items.length !== 0);
  grid.classList.toggle('d-none', items.length === 0);

  const tpl = document.getElementById('area-card-template');

  for (const area of items) {
    const node = tpl?.content?.firstElementChild ? tpl.content.firstElementChild.cloneNode(true) : document.createElement('div');

    node.querySelector('[data-area-name]')?.append(area.name);
    node.querySelector('[data-area-description]')?.append(area.description || '');

    const img = node.querySelector('[data-area-image]');
    if (img) {
      img.src = area.cover_image_url || 'assets/images/areas/placeholder.svg';
      img.alt = area.name;
    }

    const cta = node.querySelector('[data-area-cta]');
    if (cta) {
      const url = new URL('contact.html', window.location.href);
      url.searchParams.set('area', area.slug);
      cta.setAttribute('href', url.pathname + url.search);
    }

    grid.appendChild(node);
  }
}

async function init() {
  await waitForLayoutReady();

  setAlert(null);

  try {
    const areas = await getActiveAreas();
    renderAreas(areas);
  } catch (err) {
    document.querySelector('[data-areas-loading]')?.classList.add('d-none');
    setAlert(err.message || 'Falha ao carregar áreas.', 'danger');
  }
}

void init();

