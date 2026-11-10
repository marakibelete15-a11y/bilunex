import { api } from '../api.js';
import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';

try {
  initPortalLayout('admin');
} catch (error) {
  console.error('[admin-login] Portal layout initialization error:', error);
}

const form = document.getElementById('admin-login-form');
const feedback = document.getElementById('login-feedback');

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  if (feedback) feedback.textContent = 'Signing in…';

  const formData = new FormData(form);
  const payload = {
    email: formData.get('email')?.trim(),
    password: formData.get('password'),
  };

  try {
    const response = await api.post('/admin/auth/login', payload);
    auth.setSession(response.data.user);
    window.location.assign('/admin/index.html');
  } catch (error) {
    if (
      error.status === 401 ||
      String(error.message).toLowerCase().includes('email') ||
      String(error.message).toLowerCase().includes('password')
    ) {
      if (feedback) feedback.textContent = 'Incorrect email or password.';
    } else {
      if (feedback) feedback.textContent = error.message || 'Incorrect email or password.';
    }
  } finally {
    if (button) button.disabled = false;
  }
});
