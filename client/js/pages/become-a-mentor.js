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
  document.getElementById('mentor-progress-bar').dataset.currentStep = String(index + 1);
  if (index > 0) steps[index].querySelector('h3')?.focus();
};

const validateStep = index => {
  clearErrors();
  const errors = [];
  if (index === 0) {
    if (!validator.hasMinLength(field('full_name').value, 2))
      errors.push([field('full_name'), 'Enter your full name (at least 2 characters).']);
    if (!validator.isValidEmail(field('email').value))
      errors.push([field('email'), 'Enter a valid email address.']);
    if (!/^(\+2519\d{8}|09\d{8})$/.test(field('phone').value.trim()))
      errors.push([field('phone'), 'Use +2519XXXXXXXX or 09XXXXXXXX.']);
  }
  if (index === 1) {
    if (!validator.hasMinLength(field('university').value, 2))
      errors.push([field('university'), 'Enter your university or college.']);
    if (!validator.hasMinLength(field('field_of_study').value, 2))
      errors.push([field('field_of_study'), 'Enter your field of study.']);
    if (!validator.isRequired(field('academic_year').value))
      errors.push([field('academic_year'), 'Enter your academic year.']);
    if (
      !field('subjects')
        .value.split(',')
        .map(value => value.trim())
        .filter(Boolean).length
    )
      errors.push([field('subjects'), 'Enter at least one subject.']);
    const gpa = field('gpa').value;
    if (gpa !== '' && (!Number.isFinite(Number(gpa)) || Number(gpa) < 0 || Number(gpa) > 4))
      errors.push([field('gpa'), 'GPA must be between 0.00 and 4.00.']);
    const entrance = field('entrance_exam_result').value;
    if (
      entrance !== '' &&
      (!Number.isFinite(Number(entrance)) || Number(entrance) < 0 || Number(entrance) > 700)
    )
      errors.push([
        field('entrance_exam_result'),
        'Entrance exam result must be between 0 and 700.',
      ]);
  }
  if (index === 2) {
    if (!validator.isRequired(field('availability').value))
      errors.push([field('availability'), 'Summarize your availability.']);
    ['transcript', 'id_photo'].forEach(name => {
      const input = field(name);
      const file = input.files[0];
      if (!file) return;
      const extension = file.name.split('.').pop().toLowerCase();
      const typeIsValid =
        name === 'transcript'
          ? file.type === 'application/pdf' && extension === 'pdf'
          : ['image/jpeg', 'image/png'].includes(file.type) &&
            ['jpg', 'jpeg', 'png'].includes(extension);
      if (!typeIsValid)
        errors.push([
          input,
          name === 'transcript' ? 'Choose a PDF transcript.' : 'Choose a JPG, JPEG, or PNG image.',
        ]);
      if (file.size > 5 * 1024 * 1024) errors.push([input, 'The file must be 5 MB or smaller.']);
    });
  }
  if (index === 3) {
    if (!validator.hasMinLength(field('motivation').value, 10))
      errors.push([field('motivation'), 'Write at least 10 characters about your motivation.']);
    if (!field('commitment_agreement').checked)
      errors.push([field('commitment_agreement'), 'Confirm the commitment agreement to apply.']);
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

['transcript', 'id_photo'].forEach(name => {
  field(name).addEventListener('change', event => {
    const file = event.target.files[0];
    document.querySelector(`[data-file-preview="${name}"]`).textContent = file
      ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      : 'No file selected';
  });
});

const makePayload = () => {
  const payload = new FormData();
  const scalarNames = [
    'full_name',
    'email',
    'phone',
    'telegram_handle',
    'university',
    'campus',
    'field_of_study',
    'academic_year',
    'teaching_experience_duration',
    'experience_details',
    'gpa',
    'entrance_exam_result',
    'available_hours',
    'availability',
    'motivation',
    'referral_source',
  ];
  scalarNames.forEach(name => {
    const value = field(name).value.trim();
    if (value) payload.append(name, value);
  });
  payload.append(
    'subjects',
    field('subjects')
      .value.split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .join(',')
  );
  payload.append('has_teaching_experience', field('has_teaching_experience').value);
  payload.append(
    'available_days',
    [...form.querySelectorAll('[name="available_days"]:checked')]
      .map(input => input.value)
      .join(',')
  );
  payload.append('commitment_agreement', 'true');
  ['transcript', 'id_photo'].forEach(name => {
    const file = field(name).files[0];
    if (file) payload.append(name, file);
  });
  return payload;
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !validateStep(3)) return;
  submitting = true;
  feedback.textContent = '';
  ui.setButtonLoading(submitButton, true, 'Submitting…');
  try {
    const response = await api.post('/public/mentor-applications', makePayload(), {
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
    if (error instanceof ApiError && error.errors) validator.applyServerErrors(form, error.errors);
    if (error instanceof ApiError && error.status === 429)
      feedback.textContent =
        'We received too many requests from this connection. Please wait and try again.';
    else if (error instanceof ApiError && error.status >= 500)
      feedback.textContent =
        'Bilunex could not process your application right now. It has not been confirmed as submitted.';
    else if (error instanceof ApiError && error.status === 0)
      feedback.textContent =
        'We could not reach Bilunex. Check your connection and try again. Your application has not been confirmed.';
    else
      feedback.textContent = error.message || 'Please check the highlighted fields and try again.';
    ui.notify(feedback.textContent, 'error');
    feedback.focus();
  } finally {
    submitting = false;
    ui.setButtonLoading(submitButton, false);
  }
});

setStep(0);
