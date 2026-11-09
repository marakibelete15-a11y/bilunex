import { auth } from '../auth.js';
import { initPortalLayout } from '../components/layout.js';

export function setupMentor() {
  if (!auth.protectPage('mentor', '/mentor/login.html')) return null;
  initPortalLayout();
  const user = auth.getUser();
  const identity = document.getElementById('mentor-display');
  if (identity) identity.textContent = user?.name || user?.email || 'Mentor';
  return user;
}

export function makeElement(tag, text = '') {
  const element = document.createElement(tag);
  element.textContent = text == null ? '' : String(text);
  return element;
}

export function showMessage(host, text, type = 'info') {
  if (!host) return;
  const message = makeElement('p', text);
  message.className = `feedback feedback-${type}`;
  host.replaceChildren(message);
}
