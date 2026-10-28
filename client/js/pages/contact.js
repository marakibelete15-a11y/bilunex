import { initLayout } from '../components/layout.js';
import { api, ApiError } from '../api.js';
import { ui } from '../ui.js';
import { validator } from '../validation.js';

initLayout('contact');
ui.checkOriginBanner();

const form = document.getElementById('contact-form');
const feedback = document.getElementById('contact-feedback');
const submit = document.getElementById('send-inquiry');
let submitting = false;

const showFieldError = (input, message) => {
  input.setAttribute('aria-invalid', 'true');
  const error = input.closest('.form-group').querySelector('.form-error');
  error.textContent = message;
  error.classList.add('is-visible');
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  form.querySelectorAll('.form-error').forEach(item => {
    item.textContent = '';
    item.classList.remove('is-visible');
  });
  form
    .querySelectorAll('[aria-invalid="true"]')
    .forEach(input => input.removeAttribute('aria-invalid'));
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  const errors = [];
  if (!validator.hasMinLength(payload.name, 2))
    errors.push([form.elements.name, 'Enter your name (at least 2 characters).']);
  if (!validator.isValidEmail(payload.email))
    errors.push([form.elements.email, 'Enter a valid email address.']);
  if (!payload.inquiry_type) errors.push([form.elements.inquiry_type, 'Choose an inquiry type.']);
  if (!validator.hasMinLength(payload.message, 5))
    errors.push([form.elements.message, 'Enter a message of at least 5 characters.']);
  errors.forEach(([input, message]) => showFieldError(input, message));
  if (errors.length) {
    errors[0][0].focus();
    return;
  }
  if (submitting) return;
  submitting = true;
  feedback.textContent = '';
  ui.setButtonLoading(submit, true, 'Sending…');
  try {
    const response = await api.post('/public/inquiries', payload, { expectedStatus: 201 });
    if (!response.data?.id) throw new Error('The server did not return an inquiry reference.');
    document.getElementById('inquiry-reference').textContent =
      `Your inquiry was received. Reference number: #${response.data.id}`;
    document.getElementById('inquiry-reference').hidden = false;
    form.reset();
  } catch (error) {
    if (error instanceof ApiError && error.errors) validator.applyServerErrors(form, error.errors);
    if (error instanceof ApiError && error.status === 429)
      feedback.textContent =
        'We received too many requests from this connection. Please wait and try again.';
    else if (error instanceof ApiError && error.status >= 500)
      feedback.textContent =
        'Bilunex could not process your message right now. It has not been confirmed as sent.';
    else if (error instanceof ApiError && error.status === 0)
      feedback.textContent = 'We could not reach Bilunex. Check your connection and try again.';
    else
      feedback.textContent = error.message || 'Please check the highlighted fields and try again.';
    feedback.focus();
  } finally {
    submitting = false;
    ui.setButtonLoading(submit, false);
  }
});
