/**
 * Bilunex - Form Validation Helpers
 * Client-side validation utilities for immediate user feedback before API submission.
 */

const formValidator = {
  /**
   * Validate standard email pattern
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Validate required field is not empty
   * @param {string} value
   * @returns {boolean}
   */
  isRequired(value) {
    return value !== null && value !== undefined && String(value).trim().length > 0;
  },

  /**
   * Validate minimum string length
   * @param {string} value
   * @param {number} min
   * @returns {boolean}
   */
  hasMinLength(value, min) {
    return String(value).trim().length >= min;
  },

  /**
   * Show error message below an input element
   * @param {HTMLElement} inputEl
   * @param {string} message
   */
  showError(inputEl, message) {
    inputEl.classList.add('is-invalid');
    const errorEl = inputEl.parentElement.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
  },

  /**
   * Clear error message for an input element
   * @param {HTMLElement} inputEl
   */
  clearError(inputEl) {
    inputEl.classList.remove('is-invalid');
    const errorEl = inputEl.parentElement.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  },

  /**
   * Clear all errors in a form
   * @param {HTMLFormElement} formEl
   */
  clearAllErrors(formEl) {
    const inputs = formEl.querySelectorAll('.form-control');
    inputs.forEach(input => this.clearError(input));
  },
};

// Expose globally
window.formValidator = formValidator;
