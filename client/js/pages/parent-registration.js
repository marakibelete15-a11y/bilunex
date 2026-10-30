import { initLayout } from '../components/layout.js';
import { api, ApiError } from '../api.js';
import { ui } from '../ui.js';
import { validator } from '../validation.js';

initLayout('parent-registration');
ui.checkOriginBanner();

const form = document.getElementById('parent-registration-form');
const feedback = document.getElementById('form-feedback');
const submitButton = document.getElementById('submit-registration');
const steps = [...form.querySelectorAll('[data-form-step]')];
const progress = [...document.querySelectorAll('[data-progress-step]')];
const titleOther = document.getElementById('preferred_title_other');
let currentStep = 0;
let submitting = false;

const field = name => form.elements.namedItem(name);
const clearErrors = () => {
  validator.clearFormErrors(form);
  form
    .querySelectorAll('[aria-invalid="true"]')
    .forEach(input => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.form-error').forEach(error => {
    error.textContent = '';
    error.classList.remove('is-visible');
  });
};

const setError = (input, errorId, message) => {
  if (input) input.setAttribute('aria-invalid', 'true');
  const target = document.getElementById(errorId);
  if (target) {
    target.textContent = message;
    target.classList.add('is-visible');
  }
};

const setStep = index => {
  currentStep = index;
  steps.forEach((step, stepIndex) => {
    const active = stepIndex === index;
    step.hidden = !active;
    step.classList.toggle('is-current', active);
  });
  progress.forEach((item, stepIndex) => {
    item.classList.toggle('is-current', stepIndex === index);
    item.classList.toggle('is-complete', stepIndex < index);
    if (stepIndex === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  document.getElementById('form-progress-bar').dataset.currentStep = String(index + 1);
  if (index > 0) steps[index].querySelector('h2')?.focus();
};

const validateStep = index => {
  clearErrors();
  const errors = [];
  if (index === 0) {
    if (!validator.hasMinLength(field('parent_name').value, 2))
      errors.push([
        field('parent_name'),
        'parent_name-error',
        'Enter your full name (at least 2 characters).',
      ]);
    if (!validator.isValidEmail(field('email').value))
      errors.push([field('email'), 'email-error', 'Enter a valid email address.']);
    const phonePattern = /^(\+2519\d{8}|09\d{8})$/;
    if (!phonePattern.test(field('phone').value.trim()))
      errors.push([field('phone'), 'phone-error', 'Use +2519XXXXXXXX or 09XXXXXXXX.']);
    if (
      field('secondary_phone').value.trim() &&
      !phonePattern.test(field('secondary_phone').value.trim())
    )
      errors.push([
        field('secondary_phone'),
        'secondary_phone-error',
        'Use +2519XXXXXXXX or 09XXXXXXXX.',
      ]);
    const selectedTitles = [...form.querySelectorAll('[name="title-choice"]:checked')];
    if (selectedTitles.length > 1)
      errors.push([
        selectedTitles[1],
        'preferred-title-error',
        'The API accepts one preferred title. Choose only one option.',
      ]);
    if (selectedTitles[0]?.value === 'Other' && !titleOther.value.trim())
      errors.push([titleOther, 'preferred-title-error', 'Enter your preferred title.']);
    const communication = [
      ...form.querySelectorAll('[name="preferred_communication_method"]:checked'),
    ];
    if (!communication.length)
      errors.push([
        field('preferred_communication_method')[0],
        'communication-error',
        'Choose at least one preferred communication method.',
      ]);
  } else {
    if (!validator.hasMinLength(field('child_name').value, 2))
      errors.push([
        field('child_name'),
        'child_name-error',
        'Enter the student’s full name (at least 2 characters).',
      ]);
    if (!validator.isRequired(field('grade_level').value))
      errors.push([
        field('grade_level'),
        'grade_level-error',
        'Enter the student’s grade or level.',
      ]);
    if (
      !field('subjects')
        .value.split(',')
        .map(value => value.trim())
        .filter(Boolean).length
    )
      errors.push([field('subjects'), 'subjects-error', 'Enter at least one subject.']);
    if (!form.querySelector('[name="support_category"]:checked'))
      errors.push([
        field('support_category')[0],
        'support_category-error',
        'Choose a support category.',
      ]);
  }
  errors.forEach(([input, errorId, message]) => setError(input, errorId, message));
  if (errors.length) errors[0][0]?.focus();
  return errors.length === 0;
};

const syncCustomTitle = () => {
  const otherSelected = document.getElementById('title-other-check').checked;
  titleOther.disabled = !otherSelected;
  if (!otherSelected) titleOther.value = '';
};

form.querySelectorAll('[name="title-choice"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      form.querySelectorAll('[name="title-choice"]').forEach(otherChoice => {
        if (otherChoice !== checkbox) otherChoice.checked = false;
      });
    }
    syncCustomTitle();
    if (checkbox.value === 'Other' && checkbox.checked) titleOther.focus();
  });
});

form.querySelector('[data-next-step]').addEventListener('click', () => {
  if (validateStep(0)) setStep(1);
});
form.querySelector('[data-previous-step]').addEventListener('click', () => setStep(0));

const buildPayload = () => {
  const titles = [...form.querySelectorAll('[name="title-choice"]:checked')];
  const preferredTitle = titles[0]?.value === 'Other' ? titleOther.value.trim() : titles[0]?.value;
  return {
    parent_name: field('parent_name').value.trim(),
    email: field('email').value.trim(),
    phone: field('phone').value.trim(),
    secondary_phone: field('secondary_phone').value.trim() || undefined,
    preferred_title: preferredTitle || undefined,
    preferred_communication_method: [
      ...form.querySelectorAll('[name="preferred_communication_method"]:checked'),
    ].map(input => input.value),
    telegram_handle: field('telegram_handle').value.trim() || undefined,
    child_name: field('child_name').value.trim(),
    grade_level: field('grade_level').value.trim(),
    subjects: field('subjects')
      .value.split(',')
      .map(value => value.trim())
      .filter(Boolean),
    support_category: form.querySelector('[name="support_category"]:checked')?.value,
    notes: field('notes').value.trim() || undefined,
  };
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !validateStep(1)) return;
  submitting = true;
  feedback.textContent = '';
  ui.setButtonLoading(submitButton, true, 'Submitting…');
  try {
    const response = await api.post('/public/parent-registrations', buildPayload(), {
      expectedStatus: 201,
    });
    const reference = response.data?.id;
    if (!reference) throw new Error('The server did not return a registration reference.');
    form.reset();
    setStep(0);
    ui.notify(
      'Thank you. Your registration has been received. Our team will review it and contact you.'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    if (error instanceof ApiError && error.errors) validator.applyServerErrors(form, error.errors);
    if (error instanceof ApiError && error.status === 429) {
      feedback.textContent =
        'We received too many requests from this connection. Please wait a little while and try again.';
    } else if (error instanceof ApiError && error.status >= 500) {
      feedback.textContent =
        'Bilunex could not process your request right now. Your details were not confirmed as submitted. Please try again later.';
    } else if (error instanceof ApiError && error.status === 0) {
      feedback.textContent =
        'We could not reach Bilunex. Check your connection and try again. Your registration has not been confirmed.';
    } else {
      feedback.textContent = error.message || 'Please check the highlighted fields and try again.';
    }
    ui.notify(feedback.textContent, 'error');
    feedback.focus();
  } finally {
    submitting = false;
    ui.setButtonLoading(submitButton, false);
  }
});

setStep(0);
syncCustomTitle();
