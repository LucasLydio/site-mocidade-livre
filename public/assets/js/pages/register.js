import { isAuthenticated } from '../core/session.js';
import { register } from '../services/auth.service.js';

function getNextTarget() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.trim() ? next.trim() : 'profile.html';
}

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener('mocidade:layout-ready', resolve, { once: true });
  });
}

function showAlert(root, message, type = 'danger') {
  let el = root.querySelector('[data-auth-alert]');
  if (!el) {
    el = document.createElement('div');
    el.setAttribute('data-auth-alert', 'true');
    el.className = 'alert mt-3';
    root.appendChild(el);
  }

  el.className = `alert alert-${type} mt-3`;
  el.textContent = message;
}

async function init() {
  await waitForLayoutReady();

  if (isAuthenticated()) {
    window.location.href = getNextTarget();
    return;
  }

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value?.trim();
    const email = form.querySelector('[name="email"]')?.value?.trim();
    const telephone = form.querySelector('[name="telephone"]')?.value?.trim();
    const password = form.querySelector('[name="password"]')?.value || '';
    const password2 = form.querySelector('[name="password2"]')?.value || '';

    if (password !== password2) {
      showAlert(form, 'As senhas n\u00e3o conferem.', 'warning');
      return;
    }

    try {
      await register({ name, email, telephone, password });
      showAlert(form, 'Cadastro realizado com sucesso.', 'success');
      window.location.href = getNextTarget();
    } catch (err) {
      showAlert(form, err.message || 'Falha ao cadastrar.', 'danger');
    }
  });
}

void init();
