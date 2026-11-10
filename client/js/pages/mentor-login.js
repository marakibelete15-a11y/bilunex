import { api } from '../api.js';
import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';

try {
  initPortalLayout('mentor');
} catch (error) {
  console.error('[mentor-login] Portal shell could not be initialized:', error);
}

const form = document.getElementById('mentor-login-form');
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
    const response = await api.post('/mentor/auth/login', payload);
    auth.setSession(response.data.user);
    window.location.assign('/mentor/profile.html');
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
