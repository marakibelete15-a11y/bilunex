/**
 * Bilunex - Form Validation Helpers (ES Module)
 * Client-side validation mirroring server schemas with accessible DOM error rendering.
 * Enforces WCAG accessibility: aria-invalid, aria-describedby, and automatic focus management.
 */

export const validator = {
  /**
   * Validate standard email format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).trim().toLowerCase());
  },

  /**
   * Validate non-empty required string
   * @param {any} value
   * @returns {boolean}
   */
  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  /**
   * Validate minimum string length
   * @param {string} value
   * @param {number} min
   * @returns {boolean}
   */
  hasMinLength(value, min) {
    if (!value) return false;
    return String(value).trim().length >= min;
  },

  /**
   * Validate telephone format (min 7 chars, allowed phone characters)
   * @param {string} phone
   * @returns {boolean}
   */
  isValidPhone(phone) {
    if (!phone) return false;
    const trimmed = String(phone).trim();
    if (trimmed.length < 7) return false;
    const phoneRe = /^[+\d\s().-]{7,}$/;
    return phoneRe.test(trimmed);
  },

  /**
   * Validate support category enum
   * @param {string} category
   * @returns {boolean}
   */
  isValidSupportCategory(category) {
    return ['tutoring', 'mentoring', 'counseling', 'combined'].includes(category);
  },

  /**
   * Display inline field error and link with accessibility attributes
   * @param {HTMLElement} inputEl
   * @param {string} message
   */
  showFieldError(inputEl, message) {
    if (!inputEl) return;

    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');

    const container = inputEl.closest('.form-group') || inputEl.parentElement;
    if (!container) return;

    const errorEl = container.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = message; // Safe: textContent, no innerHTML
      errorEl.classList.add('is-visible');

      if (!errorEl.id) {
        errorEl.id = `error-${inputEl.id || inputEl.name || Math.random().toString(36).substr(2, 9)}`;
      }
      inputEl.setAttribute('aria-describedby', errorEl.id);
    }
  },

  /**
   * Clear error state for a single input element
   * @param {HTMLElement} inputEl
   */
  clearFieldError(inputEl) {
    if (!inputEl) return;

    inputEl.classList.remove('is-invalid');
    inputEl.setAttribute('aria-invalid', 'false');

    const container = inputEl.closest('.form-group') || inputEl.parentElement;
    if (!container) return;

    const errorEl = container.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  },

  /**
   * Clear all error states within a form
   * @param {HTMLFormElement} formEl
   */
  clearFormErrors(formEl) {
    if (!formEl) return;
    const inputs = formEl.querySelectorAll('.form-control, input, select, textarea');
    inputs.forEach(input => this.clearFieldError(input));

    const errors = formEl.querySelectorAll('.form-error');
    errors.forEach(err => {
      err.textContent = '';
      err.classList.remove('is-visible');
    });
  },

  /**
   * Move keyboard focus to the first invalid field for screen reader and keyboard accessibility
   * @param {HTMLFormElement} formEl
   */
  focusFirstError(formEl) {
    if (!formEl) return;
    const firstInvalid = formEl.querySelector('.is-invalid, [aria-invalid="true"]');
    if (firstInvalid && typeof firstInvalid.focus === 'function') {
      firstInvalid.focus();
    }
  },

  /**
   * Map server validation error array onto form fields
   * @param {HTMLFormElement} formEl
   * @param {Array<{field: string, message: string}>} serverErrors
   */
  applyServerErrors(formEl, serverErrors) {
    if (!formEl || !Array.isArray(serverErrors)) return;

    serverErrors.forEach(({ field, message }) => {
      // Find element by exact name, id, or base field name (for array/nested paths like 'subjects.0')
      const baseField = field ? field.split('.')[0] : '';
      const inputEl =
        formEl.querySelector(`[name="${field}"]`) ||
        formEl.querySelector(`#${field}`) ||
        formEl.querySelector(`[name="${field}[]"]`) ||
        (baseField ? formEl.querySelector(`[name="${baseField}"]`) : null) ||
        (baseField ? formEl.querySelector(`#${baseField}`) : null) ||
        (baseField ? formEl.querySelector(`[name="${baseField}[]"]`) : null);

      if (inputEl) {
        this.showFieldError(inputEl, message);
      }
    });

    this.focusFirstError(formEl);
  },
};

// Global fallback for vanilla non-modular scripts
if (typeof window !== 'undefined') {
  window.formValidator = validator;
}
