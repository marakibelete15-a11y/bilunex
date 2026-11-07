import { api } from '../api.js';
import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';
try {
  initPortalLayout();
} catch (error) {
  console.error('[mentor-login] Portal shell could not be initialized:', error);
}
const form = document.getElementById('mentor-login-form');
const feedback = document.getElementById('login-feedback');
if (!form || !feedback) throw new Error('Mentor login form is unavailable.');
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  feedback.textContent = 'Signing in…';
  try {
    const response = await api.post('/mentor/auth/login', Object.fromEntries(new FormData(form)));
    auth.setSession(response.data.token, response.data.user);
    window.location.assign('/mentor/index.html');
  } catch (error) {
    if (
      error.status === 401 ||
      String(error.message).toLowerCase().includes('email') ||
      String(error.message).toLowerCase().includes('password')
    ) {
      feedback.textContent = 'Incorrect email or password.';
    } else {
      feedback.textContent = error.message || 'Incorrect email or password.';
    }
  } finally {
    button.disabled = false;
  }
});
