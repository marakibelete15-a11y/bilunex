import { initLayout } from '../components/layout.js';
import { api, ApiError } from '../api.js';
import { ui } from '../ui.js';
initLayout('share-your-story');
ui.checkOriginBanner();
const form = document.getElementById('story-form');
const feedback = document.getElementById('story-feedback');
const body = form.elements.body;
const counter = document.getElementById('story-counter');
const button = document.getElementById('submit-story');
let submitting = false;
body.addEventListener('input', () => {
  counter.textContent = `${body.value.length} / 2000 characters (minimum 50)`;
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  form.querySelectorAll('.form-error').forEach(node => {
    node.textContent = '';
    node.classList.remove('is-visible');
  });
  const fields = ['full_name', 'title', 'body'];
  let invalid = false;
  fields.forEach(name => {
    const input = form.elements[name];
    const valid =
      name === 'body' ? input.value.trim().length >= 50 : input.value.trim().length >= 2;
    if (!valid) {
      const error = input.closest('.form-group').querySelector('.form-error');
      error.textContent =
        name === 'body' ? 'Write at least 50 characters.' : 'This field is required.';
      error.classList.add('is-visible');
      invalid = true;
    }
  });
  if (form.elements.email.value && !form.elements.email.validity.valid) {
    form.elements.email.closest('.form-group').querySelector('.form-error').textContent =
      'Enter a valid email address.';
    invalid = true;
  }
  const consentChecks = ['consent_genuine', 'consent_publish', 'consent_child_guardian'];
  if (consentChecks.some(name => !form.elements[name].checked)) {
    form.querySelector('fieldset .form-error').textContent =
      'Please accept each consent statement.';
    invalid = true;
  }
  if (invalid) return;
  submitting = true;
  ui.setButtonLoading(button, true, 'Submitting…');
  feedback.textContent = '';
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    consentChecks.forEach(name => {
      payload[name] = form.elements[name].checked;
    });
    if (payload.website) throw new Error('Unable to submit this form.');
    const response = await api.post('/public/stories', payload, { expectedStatus: 201 });
    if (!response.data?.id) throw new Error('The server did not confirm the submission.');
    form.reset();
    counter.textContent = '0 / 2000 characters (minimum 50)';
    ui.notify(
      'Thank you for sharing. Your story has been received and will be reviewed before it is published.'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    feedback.textContent =
      error instanceof ApiError ? error.message : error.message || 'Please try again.';
    ui.notify(feedback.textContent, 'error');
  } finally {
    submitting = false;
    ui.setButtonLoading(button, false);
  }
});
