import { initLayout } from '../components/layout.js';
import { api, ApiError } from '../api.js';
import { ui } from '../ui.js';
import { validator } from '../validation.js';

initLayout('become-a-mentor');
ui.checkOriginBanner();

const form = document.getElementById('mentor-application-form');
const feedback = document.getElementById('mentor-feedback');
const submitButton = document.getElementById('submit-mentor-application');
const steps = [...form.querySelectorAll('[data-form-step]')];
const progressItems = [...document.querySelectorAll('[data-progress-step]')];
let activeStep = 0;
let submitting = false;

const field = name => form.elements.namedItem(name);
const otherSubjectsToggle = document.getElementById('mentor-subject-other-toggle');

if (otherSubjectsToggle) {
  otherSubjectsToggle.addEventListener('change', () => {
    const otherBox = document.getElementById('mentor-other-subjects');
    if (otherBox) otherBox.hidden = !otherSubjectsToggle.checked;
  });
}

const clearErrors = () => {
  form.querySelectorAll('.form-error').forEach(error => {
    error.textContent = '';
    error.classList.remove('is-visible');
  });
  form
    .querySelectorAll('[aria-invalid="true"]')
    .forEach(input => input.removeAttribute('aria-invalid'));
};

const setError = (input, message) => {
  if (input) input.setAttribute('aria-invalid', 'true');
  const group = input?.closest('.form-group');
  const error = group?.querySelector('.form-error');
  if (error) {
    error.textContent = message;
    error.classList.add('is-visible');
  }
};

const setStep = index => {
  activeStep = index;
  steps.forEach((step, stepIndex) => {
    step.hidden = stepIndex !== index;
    step.classList.toggle('is-current', stepIndex === index);
  });
  progressItems.forEach((item, itemIndex) => {
    item.classList.toggle('is-current', itemIndex === index);
    item.classList.toggle('is-complete', itemIndex < index);
    if (itemIndex === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  const progressBar = document.getElementById('mentor-progress-bar');
  if (progressBar) progressBar.dataset.currentStep = String(index + 1);
  if (index > 0) steps[index].querySelector('h3')?.focus();
};

const isValidPhone = val => {
  if (!val || typeof val !== 'string') return false;
  const cleaned = val.replace(/[\s\-\(\)\.]/g, '');
  if (/^0[79]\d{8}$/.test(cleaned)) return true;
  if (/^\+251[79]\d{8}$/.test(cleaned)) return true;
  if (/^\+?[1-9]\d{6,14}$/.test(cleaned)) return true;
  return false;
};

const validateStep = index => {
  clearErrors();
  const errors = [];
  if (index === 0) {
    if (!validator.hasMinLength(field('full_name').value, 2)) {
      errors.push([field('full_name'), 'Enter your full name (at least 2 characters).']);
    }
    if (!validator.isValidEmail(field('email').value)) {
      errors.push([field('email'), 'Enter a valid email address.']);
    }
    const phoneVal = field('phone').value.trim();
    if (!phoneVal || !isValidPhone(phoneVal)) {
      errors.push([
        field('phone'),
        'Use Ethiopian (+2519..., 09...) or valid international phone format.',
      ]);
    }
  }

  if (index === 1) {
    if (!validator.hasMinLength(field('university').value, 2)) {
      errors.push([field('university'), 'Enter your university or college.']);
    }
    if (!validator.hasMinLength(field('field_of_study').value, 2)) {
      errors.push([field('field_of_study'), 'Enter your field of study.']);
    }
    if (!validator.isRequired(field('academic_year').value)) {
      errors.push([field('academic_year'), 'Enter your academic year.']);
    }
    const otherSubjectsInput = document.getElementById('mentor-subject-other');
    const otherSubjects = otherSubjectsInput?.value || '';
    const subjectChecks = [...form.querySelectorAll('[name="subjects"]:checked')];
    const customSubjects = otherSubjects
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    const subjectError = document.querySelector('[data-subject-error]');
    if (subjectError) subjectError.textContent = '';
    if (!subjectChecks.length && !(otherSubjectsToggle?.checked && customSubjects.length)) {
      errors.push([
        document.getElementById('mentor-subjects-group'),
        'Choose at least one subject.',
      ]);
    }
    if (customSubjects.length > 10 || customSubjects.some(value => value.length > 50)) {
      errors.push([
        otherSubjectsInput,
        'Enter up to 10 other subjects, each no longer than 50 characters.',
      ]);
    }
  }

  if (index === 2) {
    if (![...form.querySelectorAll('[name="available_hours"]:checked')].length) {
      errors.push([
        document.getElementById('available-hours-group'),
        'Select at least one available time.',
      ]);
    }
    if (!validator.isRequired(field('availability').value)) {
      errors.push([field('availability'), 'Summarize your availability.']);
    }
  }

  if (index === 3) {
    if (!validator.hasMinLength(field('motivation').value, 10)) {
      errors.push([field('motivation'), 'Write at least 10 characters about your motivation.']);
    }
    if (!field('commitment_agreement').checked) {
      errors.push([field('commitment_agreement'), 'Confirm the commitment agreement to apply.']);
    }
  }

  errors.forEach(([input, message]) => setError(input, message));
  if (errors.length) errors[0][0]?.focus();
  return errors.length === 0;
};

form.querySelectorAll('[data-next-step]').forEach(button =>
  button.addEventListener('click', () => {
    if (validateStep(activeStep)) setStep(activeStep + 1);
  })
);

form
  .querySelectorAll('[data-previous-step]')
  .forEach(button => button.addEventListener('click', () => setStep(activeStep - 1)));

const makePayload = () => {
  const subjects = [...form.querySelectorAll('[name="subjects"]:checked')].map(
    input => input.value
  );
  const otherSubjects = otherSubjectsToggle?.checked
    ? (document.getElementById('mentor-subject-other')?.value || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
    : [];
  const allSubjects = [...subjects, ...otherSubjects];

  const availableHours = [...form.querySelectorAll('[name="available_hours"]:checked')].map(
    input => input.value
  );
  const availableDays = [...form.querySelectorAll('[name="available_days"]:checked')].map(
    input => input.value
  );

  return {
    full_name: field('full_name').value.trim(),
    email: field('email').value.trim(),
    phone: field('phone').value.trim(),
    telegram_handle: field('telegram_handle')?.value.trim() || undefined,
    university: field('university').value.trim(),
    field_of_study: field('field_of_study').value.trim(),
    academic_year: field('academic_year').value.trim(),
    subjects: allSubjects,
    availability: field('availability').value.trim(),
    available_hours: availableHours.length ? availableHours : undefined,
    available_days: availableDays.length ? availableDays : undefined,
    motivation: field('motivation').value.trim(),
  };
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !validateStep(3)) return;
  submitting = true;
  feedback.textContent = '';
  ui.setButtonLoading(submitButton, true, 'Submitting…');

  try {
    const response = await api.post('/mentors/apply', makePayload(), {
      expectedStatus: 201,
    });
    if (!response.data?.id) throw new Error('The server did not return an application reference.');
    form.reset();
    setStep(0);
    ui.notify(
      'Thank you. Your application has been received. The Bilunex team will review it and contact you about next steps.'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    if (error instanceof ApiError && error.errors) {
      validator.applyServerErrors(form, error.errors);
    }
    if (error instanceof ApiError && error.status === 429) {
      feedback.textContent =
        'We received too many requests from this connection. Please wait and try again.';
    } else if (error instanceof ApiError && error.status >= 500) {
      feedback.textContent =
        'Bilunex could not process your application right now. It has not been confirmed as submitted.';
    } else if (error instanceof ApiError && error.status === 0) {
      feedback.textContent =
        'We could not reach Bilunex. Check your connection and try again. Your application has not been confirmed.';
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
