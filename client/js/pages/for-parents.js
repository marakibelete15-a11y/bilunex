/**
 * Bilunex - Parent Registration Page Controller (ES Module)
 * Handles client-side intake form validation, submission to Express backend,
 * accessible error handling, and visual status updates.
 */

import { api } from '../api.js';
import { validator } from '../validation.js';
import { ui } from '../ui.js';
import { initLayout } from '../components/layout.js';

/**
 * Initialize the page layout and interactive behavior
 */
document.addEventListener('DOMContentLoaded', () => {
  // Inject the shared accessible 7-item navigation header and footer
  initLayout('for-parents');

  const form = document.getElementById('parent-registration-form');
  const submitBtn = document.getElementById('submit-btn');
  const feedbackContainer = document.getElementById('form-feedback');

  if (!form || !submitBtn) return;

  // Clear errors when the user starts modifying input fields
  form.addEventListener('input', e => {
    if (e.target && e.target.matches('.form-control, input, select, textarea')) {
      validator.clearFieldError(e.target);
    }
  });

  form.addEventListener('change', e => {
    if (e.target && e.target.matches('input[type="checkbox"], input[type="radio"], select')) {
      validator.clearFieldError(e.target);
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', async e => {
    e.preventDefault();

    // 1. Clear previous alerts and field errors
    ui.clearAlert(feedbackContainer);
    validator.clearFormErrors(form);

    // 2. Read form input values
    const parentNameInput = document.getElementById('parent_name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const telegramInput = document.getElementById('telegram_handle');
    const childNameInput = document.getElementById('child_name');
    const gradeLevelSelect = document.getElementById('grade_level');
    const notesInput = document.getElementById('notes');

    const parent_name = parentNameInput ? parentNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const telegram_handle =
      telegramInput && telegramInput.value.trim().length > 0 ? telegramInput.value.trim() : null;
    const child_name = childNameInput ? childNameInput.value.trim() : '';
    const grade_level = gradeLevelSelect ? gradeLevelSelect.value.trim() : '';
    const notes = notesInput && notesInput.value.trim().length > 0 ? notesInput.value.trim() : null;

    // Read checked subjects (must be an array with >= 1 item)
    const subjectCheckboxes = form.querySelectorAll('input[name="subjects"]:checked');
    const subjects = Array.from(subjectCheckboxes).map(cb => cb.value);

    // Read selected support category
    const selectedCategoryRadio = form.querySelector('input[name="support_category"]:checked');
    const support_category = selectedCategoryRadio ? selectedCategoryRadio.value : '';

    // 3. Client-Side Accessible Validation
    let isValid = true;

    // Parent Name
    if (!validator.isRequired(parent_name)) {
      validator.showFieldError(parentNameInput, 'Parent / Guardian name is required.');
      isValid = false;
    } else if (!validator.hasMinLength(parent_name, 2)) {
      validator.showFieldError(parentNameInput, 'Parent name must be at least 2 characters.');
      isValid = false;
    }

    // Email Address
    if (!validator.isRequired(email)) {
      validator.showFieldError(emailInput, 'Email address is required.');
      isValid = false;
    } else if (!validator.isValidEmail(email)) {
      validator.showFieldError(
        emailInput,
        'Please provide a valid email address (e.g. parent@example.com).'
      );
      isValid = false;
    }

    // Phone Number
    if (!validator.isRequired(phone)) {
      validator.showFieldError(phoneInput, 'Phone number is required for session coordination.');
      isValid = false;
    } else if (!validator.isValidPhone(phone)) {
      validator.showFieldError(
        phoneInput,
        'Please provide a valid phone number with at least 7 digits.'
      );
      isValid = false;
    }

    // Student / Child Name
    if (!validator.isRequired(child_name)) {
      validator.showFieldError(childNameInput, 'Student name is required.');
      isValid = false;
    } else if (!validator.hasMinLength(child_name, 2)) {
      validator.showFieldError(childNameInput, 'Student name must be at least 2 characters.');
      isValid = false;
    }

    // Grade Level
    if (!validator.isRequired(grade_level)) {
      validator.showFieldError(
        gradeLevelSelect,
        'Please select the student’s current grade level.'
      );
      isValid = false;
    }

    // Subjects Selection (min 1 required)
    if (subjects.length === 0) {
      const firstSubjectCb = form.querySelector('input[name="subjects"]');
      validator.showFieldError(
        firstSubjectCb,
        'Please select at least one subject needing academic support.'
      );
      isValid = false;
    }

    // Support Category
    if (
      !validator.isRequired(support_category) ||
      !validator.isValidSupportCategory(support_category)
    ) {
      const firstCategoryRadio = form.querySelector('input[name="support_category"]');
      validator.showFieldError(firstCategoryRadio, 'Please select a primary support category.');
      isValid = false;
    }

    // If validation fails, focus the first invalid field for keyboard & screen reader accessibility
    if (!isValid) {
      validator.focusFirstError(form);
      ui.showAlert(
        feedbackContainer,
        'error',
        'Please review and complete all required fields highlighted in red below.'
      );
      return;
    }

    // 4. Assemble payload matching POST /api/v1/public/parent-registrations schema
    const payload = {
      parent_name,
      email,
      phone,
      telegram_handle,
      child_name,
      grade_level,
      subjects,
      support_category,
      notes,
    };

    // 5. Submit to backend API with loading state
    ui.setButtonLoading(submitBtn, true, 'Submitting Registration...');

    try {
      const response = await api.post('/public/parent-registrations', payload);

      // Reset form and show success message
      form.reset();
      validator.clearFormErrors(form);

      const successMsg =
        response.message ||
        'Registration submitted successfully! Our intake coordinator will contact you within [To be confirmed by Bilunex] business days to finalize your mentor match.';

      ui.showAlert(feedbackContainer, 'success', successMsg);

      // Scroll to feedback message so the user receives confirmation
      feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      // Handle 400 Bad Request with field-level issues
      if (err.status === 400 && Array.isArray(err.errors) && err.errors.length > 0) {
        validator.applyServerErrors(form, err.errors);
        ui.showAlert(
          feedbackContainer,
          'error',
          'Some submission details need correction. Please review the highlighted fields below.'
        );
      } else if (err.status === 429) {
        // Rate limiting
        ui.showAlert(
          feedbackContainer,
          'warning',
          'Too many registration attempts. Please wait a short while before trying again.'
        );
      } else {
        // General or network error
        ui.showAlert(
          feedbackContainer,
          'error',
          err.message ||
            'Unable to submit registration. Please check your connection and try again.'
        );
      }
    } finally {
      ui.setButtonLoading(submitBtn, false);
    }
  });
});
