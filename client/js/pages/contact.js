import { initLayout } from '../components/layout.js';
import { api, ApiError } from '../api.js';
import { ui } from '../ui.js';
import { validator } from '../validation.js';
import { siteInfo } from '../config/site-info.js';

initLayout('contact');
ui.checkOriginBanner();

const setContactLink = (key, label, href, external = false) => {
  const link = document.querySelector(`[data-contact="${key}"]`);
  if (!link) return;
  link.textContent = label;
  link.href = href;
  if (external) link.rel = 'noopener noreferrer';
};

const hoursEl = document.querySelector('[data-contact="hours"]');
if (hoursEl) hoursEl.textContent = siteInfo.parentSupportHours;
setContactLink('email', siteInfo.email, `mailto:${siteInfo.email}`);
setContactLink('phone', siteInfo.phone, `tel:${siteInfo.phoneHref}`);
setContactLink('telegram', siteInfo.telegram, siteInfo.telegramUrl, true);
const locEl = document.querySelector('[data-contact="location"]');
if (locEl) locEl.textContent = siteInfo.address;
setContactLink('parent-email', siteInfo.email, `mailto:${siteInfo.email}`);
setContactLink('counseling-email', siteInfo.email, `mailto:${siteInfo.email}`);

const form = document.getElementById('contact-form');
const feedback = document.getElementById('contact-feedback');
const submit = document.getElementById('send-inquiry');
let submitting = false;

const showFieldError = (input, message) => {
  if (!input) return;
  input.setAttribute('aria-invalid', 'true');
  const group = input.closest('.form-group');
  const error = group ? group.querySelector('.form-error') : null;
  if (error) {
    error.textContent = message;
    error.classList.add('is-visible');
  }
};

const isValidPhone = val => {
  if (!val || typeof val !== 'string') return false;
  const cleaned = val.replace(/[\s\-\(\)\.]/g, '');
  if (/^0[79]\d{8}$/.test(cleaned)) return true;
  if (/^\+251[79]\d{8}$/.test(cleaned)) return true;
  if (/^\+?[1-9]\d{6,14}$/.test(cleaned)) return true;
  return false;
};

form?.addEventListener('submit', async event => {
  event.preventDefault();
  form.querySelectorAll('.form-error').forEach(item => {
    item.textContent = '';
    item.classList.remove('is-visible');
  });
  form
    .querySelectorAll('[aria-invalid="true"]')
    .forEach(input => input.removeAttribute('aria-invalid'));

  const data = new FormData(form);
  const rawPayload = Object.fromEntries(data.entries());
  const payload = {
    name: rawPayload.name?.trim(),
    email: rawPayload.email?.trim(),
    phone: rawPayload.phone?.trim() || undefined,
    inquiry_type: rawPayload.inquiry_type?.trim(),
    message: rawPayload.message?.trim(),
  };

  const errors = [];
  if (!validator.hasMinLength(payload.name, 2)) {
    errors.push([form.elements.name, 'Enter your name (at least 2 characters).']);
  }
  if (!validator.isValidEmail(payload.email)) {
    errors.push([form.elements.email, 'Enter a valid email address.']);
  }
  if (payload.phone && !isValidPhone(payload.phone)) {
    errors.push([
      form.elements.phone,
      'Use Ethiopian (+2519..., 09...) or valid international phone format.',
    ]);
  }
  if (!payload.inquiry_type) {
    errors.push([form.elements.inquiry_type, 'Choose an inquiry type.']);
  }
  if (!validator.hasMinLength(payload.message, 5)) {
    errors.push([form.elements.message, 'Enter a message of at least 5 characters.']);
  }

  errors.forEach(([input, message]) => showFieldError(input, message));
  if (errors.length) {
    errors[0][0]?.focus();
    return;
  }

  if (submitting) return;
  submitting = true;
  if (feedback) feedback.textContent = '';
  ui.setButtonLoading(submit, true, 'Sending…');

  try {
    const response = await api.post('/inquiries', payload, { expectedStatus: 201 });
    if (!response.data?.id) throw new Error('The server did not return an inquiry reference.');
    form.reset();
    ui.notify('Thank you. Your message has been received. We will get back to you.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    if (error instanceof ApiError && error.errors) {
      validator.applyServerErrors(form, error.errors);
    }
    const msg =
      error instanceof ApiError && error.status === 429
        ? 'We received too many requests from this connection. Please wait and try again.'
        : error instanceof ApiError && error.status >= 500
          ? 'Bilunex could not process your message right now. It has not been confirmed as sent.'
          : error instanceof ApiError && error.status === 0
            ? 'We could not reach Bilunex. Check your connection and try again.'
            : error.message || 'Please check the highlighted fields and try again.';

    if (feedback) feedback.textContent = msg;
    ui.notify(msg, 'error');
    if (feedback) feedback.focus();
  } finally {
    submitting = false;
    ui.setButtonLoading(submit, false);
  }
});
