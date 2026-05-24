import { clearSession, requireAuthRedirect } from '../../core/session.js';
import { getMe } from '../../services/user.service.js';

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

async function init() {
  await waitForLayoutReady();

  if (!requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/index.html' })) return;

  try {
    const me = await getMe();
    if (me.role !== 'admin') {
      setAlert('Acesso restrito: admin somente.', 'warning');
      window.location.href = '../index.html';
      return;
    }
  } catch (err) {
    const status = err?.statusCode || err?.status || 0;
    if (status === 401) {
      clearSession();
      requireAuthRedirect({ redirectTo: '../login.html', next: 'admin/index.html' });
      return;
    }
    setAlert(err.message || 'Falha ao carregar sessão.', 'danger');
  }
}

void init();

