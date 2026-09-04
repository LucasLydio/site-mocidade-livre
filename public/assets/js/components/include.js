const THEME_KEY = 'mocidade_theme';

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const icon = document.getElementById('theme-icon');
  const btn = document.getElementById('theme-toggle');
  const mobileBtn = document.getElementById('theme-toggle-mobile');

  const isDark = theme === 'dark';
  if (icon) icon.className = isDark ? 'bi bi-moon-stars-fill' : 'bi bi-brightness-high';
  if (btn) btn.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
  if (mobileBtn) {
    mobileBtn.innerHTML = isDark
      ? '<i class="bi bi-moon-stars-fill me-2" aria-hidden="true"></i> Tema'
      : '<i class="bi bi-brightness-high me-2" aria-hidden="true"></i> Tema';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  return element;
}

function addGraffitiText(svg, text, attributes) {
  const textElement = createSvgElement('text', attributes);
  textElement.textContent = text;
  svg.append(textElement);
}

function initPageArt() {
  if (document.querySelector('.site-art-layer')) return;

  const layer = document.createElement('div');
  layer.className = 'site-art-layer';
  layer.setAttribute('aria-hidden', 'true');

  const graffiti = createSvgElement('svg', {
    class: 'site-art-layer__graffiti',
    viewBox: '0 0 1440 900',
    preserveAspectRatio: 'none'
  });

  [
    ['path', { d: 'M42 742 C180 650 282 826 430 704 S688 638 804 754', fill: 'none', stroke: 'var(--brand-2)', 'stroke-width': 7 }],
    ['path', { d: 'M1040 118 C1128 68 1198 166 1138 226 S1108 344 1240 328', fill: 'none', stroke: 'var(--brand)', 'stroke-width': 6 }],
    ['path', { d: 'M890 690 C948 626 1026 708 982 766 S1088 842 1178 764', fill: 'none', stroke: 'var(--brand-4)', 'stroke-width': 7 }],
    ['line', { x1: 172, y1: 170, x2: 258, y2: 118, stroke: 'var(--brand-3)', 'stroke-width': 8, 'stroke-linecap': 'round' }],
    ['line', { x1: 190, y1: 112, x2: 238, y2: 184, stroke: 'var(--brand-3)', 'stroke-width': 8, 'stroke-linecap': 'round' }],
    ['circle', { cx: 1310, cy: 642, r: 36, fill: 'none', stroke: 'var(--brand-2)', 'stroke-width': 7 }]
  ].forEach(([tagName, attributes]) => graffiti.append(createSvgElement(tagName, attributes)));

  addGraffitiText(graffiti, 'livre', {
    class: 'site-art-layer__tag site-art-layer__tag--green',
    x: 84,
    y: 318,
    transform: 'rotate(-10 84 318)'
  });
  addGraffitiText(graffiti, 'ML', {
    class: 'site-art-layer__tag site-art-layer__tag--red',
    x: 1150,
    y: 510,
    transform: 'rotate(9 1150 510)'
  });
  addGraffitiText(graffiti, 'fe', {
    class: 'site-art-layer__tag site-art-layer__tag--yellow',
    x: 626,
    y: 176,
    transform: 'rotate(7 626 176)'
  });

  const plane = createSvgElement('svg', {
    class: 'site-paper-plane',
    viewBox: '0 0 180 132'
  });

  plane.append(
    createSvgElement('path', {
      class: 'site-paper-plane__trail',
      d: 'M3 110 C30 84 54 120 72 94 C86 74 64 58 50 74 C30 100 72 124 112 84'
    }),
    createSvgElement('path', {
      class: 'site-paper-plane__paper',
      d: 'M74 24 L170 4 L140 120 L112 80 L82 102 Z'
    }),
    createSvgElement('path', {
      class: 'site-paper-plane__wing',
      d: 'M112 80 L170 4 L140 120 Z'
    }),
    createSvgElement('path', {
      class: 'site-paper-plane__wing',
      d: 'M82 102 L104 70 L112 80 Z'
    }),
    createSvgElement('path', {
      class: 'site-paper-plane__line',
      d: 'M74 24 L170 4 L140 120 L112 80 M74 24 L112 80 M82 102 L104 70'
    })
  );

  layer.append(graffiti, plane);
  document.body.prepend(layer);

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReducedMotion) return;

  let rafId = 0;

  function updatePlane() {
    rafId = 0;

    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const startX = viewportWidth * 0.74;
    const endX = viewportWidth * 0.14;
    const startY = viewportHeight * 0.16;
    const endY = viewportHeight * 0.72;
    const curve = Math.sin(progress * Math.PI * 2) * Math.min(54, viewportWidth * 0.08);
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress + curve;
    const rotate = -10 + progress * 34;

    plane.style.setProperty('--paper-plane-x', `${Math.round(x)}px`);
    plane.style.setProperty('--paper-plane-y', `${Math.round(y)}px`);
    plane.style.setProperty('--paper-plane-rotate', `${rotate.toFixed(1)}deg`);
  }

  function schedulePlaneUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(updatePlane);
  }

  window.addEventListener('scroll', schedulePlaneUpdate, { passive: true });
  window.addEventListener('resize', schedulePlaneUpdate);
  schedulePlaneUpdate();
}

async function includeOnce(root = document) {
  const nodes = Array.from(root.querySelectorAll('[data-include]'));
  await Promise.all(
    nodes.map(async (node) => {
      const source = node.getAttribute('data-include');
      if (!source) return;

      const url = new URL(source, window.location.origin);
      if (url.origin !== window.location.origin) {
        throw new Error('Includes externos não são permitidos.');
      }

      const res = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      if (!res.ok) {
        throw new Error(`Falha ao carregar componente (${res.status}).`);
      }

      node.innerHTML = await res.text();
      node.removeAttribute('data-include');
    }),
  );
  return nodes.length;
}

export async function includeAll() {
  let count = 0;
  do {
    count = await includeOnce(document);
  } while (count > 0);
}

export function initLayout() {
  // setTheme(getPreferredTheme());

  // document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  // document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Active link highlight
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.site-nav a.nav-link').forEach((a) => {
    const href = (a.getAttribute('href') || '').trim();
    if (!href) return;
    const targetFile = href.split('/').pop().toLowerCase();
    const isIndex = href === '/' || href === './' || href === 'index.html' || href === './index.html';
    const match = (isIndex && (currentFile === '' || currentFile === 'index.html')) || currentFile === targetFile;
    if (match) a.classList.add('active');
  });
}

async function autoInit() {
  initPageArt();
  await includeAll();
  initLayout();

  window.__mocidadeLayoutReady = true;
  document.dispatchEvent(new CustomEvent('mocidade:layout-ready'));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    void autoInit();
  }
}
