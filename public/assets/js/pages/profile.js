import { clearSession, requireAuthRedirect, setSession } from '../core/session.js';
import { logout } from '../services/auth.service.js';
import { getMe, updateMe } from '../services/user.service.js';

function waitForLayoutReady() {
  if (window.__mocidadeLayoutReady) return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener('mocidade:layout-ready', resolve, { once: true });
  });
}

function setAlert(message, type = 'danger') {
  const el = document.getElementById('profile-alert');
  if (!el) return;

  if (!message) {
    el.className = 'alert d-none';
    el.textContent = '';
    return;
  }

  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function setLoading(isLoading) {
  document.getElementById('profile-loading')?.classList.toggle('d-none', !isLoading);
  document.getElementById('profile-form')?.classList.toggle('d-none', isLoading);
}

function fillForm(user) {
  const form = document.getElementById('profile-form');
  if (!form) return;

  const nameInput = form.querySelector('[name="name"]');
  if (nameInput) nameInput.value = user?.name || '';

  const telInput = form.querySelector('[name="telephone"]');
  if (telInput) telInput.value = user?.telephone || '';

  const emailInput = form.querySelector('[name="email"]');
  if (emailInput) emailInput.value = user?.email || '';

  const roleInput = form.querySelector('[name="role"]');
  if (roleInput) roleInput.value = user?.role || '';
}

async function loadProfile() {
  setAlert(null);
  setLoading(true);

  try {
    const user = await getMe();
    setSession({ token: undefined, user });
    fillForm(user);
  } catch (err) {
    const status = err?.statusCode || err?.status || 0;
    if (status === 401) {
      clearSession();
      requireAuthRedirect({ next: 'profile.html' });
      return;
    }

    setAlert(err.message || 'Falha ao carregar perfil.', 'danger');
  } finally {
    setLoading(false);
  }
}

async function init() {
  await waitForLayoutReady();

  if (!requireAuthRedirect({ next: 'profile.html' })) return;

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await logout();
    window.location.href = 'login.html';
  });

  const form = document.getElementById('profile-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert(null);

    const name = form.querySelector('[name="name"]')?.value?.trim();
    const telephone = form.querySelector('[name="telephone"]')?.value?.trim();

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const user = await updateMe({ name, telephone });
      setSession({ token: undefined, user });
      setAlert('Perfil atualizado com sucesso.', 'success');
      fillForm(user);
    } catch (err) {
      const status = err?.statusCode || err?.status || 0;
      if (status === 401) {
        clearSession();
        requireAuthRedirect({ next: 'profile.html' });
        return;
      }

      setAlert(err.message || 'Falha ao atualizar perfil.', 'danger');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  await loadProfile();
}

void init();
