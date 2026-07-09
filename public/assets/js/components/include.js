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
