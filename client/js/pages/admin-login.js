import { api } from '../api.js';
import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';
initPortalLayout();
const form = document.getElementById('admin-login-form');
const feedback = document.getElementById('login-feedback');
if (auth.getToken() && ['admin', 'super_admin'].includes(auth.getUser()?.role))
  window.location.replace('index.html');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  feedback.textContent = 'Signing in…';
  try {
    const response = await api.post('/admin/auth/login', Object.fromEntries(new FormData(form)));
    auth.setSession(response.data.token, response.data.user);
    window.location.assign('index.html');
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
