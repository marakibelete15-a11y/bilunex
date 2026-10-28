import { api } from '../api.js';
import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';
initPortalLayout();
const form = document.getElementById('mentor-login-form');
const feedback = document.getElementById('login-feedback');
if (auth.getToken() && auth.getUser()?.role === 'mentor') window.location.replace('profile.html');
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  feedback.textContent = 'Signing in…';
  try {
    const response = await api.post('/mentor/auth/login', Object.fromEntries(new FormData(form)));
    auth.setSession(response.data.token, response.data.user);
    window.location.assign('profile.html');
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
