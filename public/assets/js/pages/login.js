import { isAuthenticated } from '../core/session.js';
import { safeLocalTarget } from '../core/router-helpers.js';
import { login, recoverPassword } from '../services/auth.service.js';

function getNextTarget() {
  const next = new URLSearchParams(window.location.search).get('next');
  return safeLocalTarget(next, 'profile.html');
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

  const form = document.getElementById('login-form');
  const recoverForm = document.getElementById('recover-password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const email = form.querySelector('[name="email"]')?.value?.trim();
    const password = form.querySelector('[name="password"]')?.value || '';
    const submitButton = form.querySelector('[type="submit"]');

    try {
      if (submitButton) submitButton.disabled = true;
      await login({ email, password });
      showAlert(form, 'Login realizado com sucesso.', 'success');
      window.location.href = getNextTarget();
    } catch (err) {
      showAlert(form, err.message || 'Falha ao entrar.', 'danger');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  recoverForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!recoverForm.checkValidity()) {
      recoverForm.reportValidity();
      return;
    }

    const email = recoverForm.querySelector('[name="email"]')?.value?.trim();
    const submitButton = recoverForm.querySelector('[type="submit"]');

    try {
      if (submitButton) submitButton.disabled = true;
      const result = await recoverPassword({ email });
      showAlert(recoverForm, result.message || 'Se este email estiver cadastrado, enviaremos uma senha temporária em instantes.', 'success');
    } catch (err) {
      showAlert(recoverForm, err.message || 'Falha ao solicitar recuperação de senha.', 'danger');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

void init();
