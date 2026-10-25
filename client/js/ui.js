/**
 * Bilunex - UI Helpers
 * DOM helpers, mobile navigation toggle, alert notifications, and loading states.
 */

const ui = {
  /**
   * Display an alert banner in a target container
   * @param {HTMLElement|string} target - Container element or selector
   * @param {'success'|'error'|'info'} type - Alert style
   * @param {string} message - Message to display
   * @param {number} [autoDismissMs] - Optional auto dismiss time in ms
   */
  showAlert(target, type, message, autoDismissMs = 0) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;

    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type === 'error' ? 'error' : type === 'info' ? 'info' : 'success'}`;
    alertEl.innerHTML = `<span>${message}</span>`;

    container.innerHTML = '';
    container.appendChild(alertEl);

    if (autoDismissMs > 0) {
      setTimeout(() => {
        alertEl.remove();
      }, autoDismissMs);
    }
  },

  /**
   * Toggle button loading state
   * @param {HTMLButtonElement} buttonEl
   * @param {boolean} isLoading
   * @param {string} [loadingText]
   */
  setLoading(buttonEl, isLoading, loadingText = 'Processing...') {
    if (!buttonEl) return;
    if (isLoading) {
      buttonEl.dataset.originalText = buttonEl.innerHTML;
      buttonEl.disabled = true;
      buttonEl.textContent = loadingText;
    } else {
      buttonEl.disabled = false;
      buttonEl.innerHTML = buttonEl.dataset.originalText || 'Submit';
    }
  },

  /**
   * Initialize mobile navigation menu toggle
   */
  initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');

    if (navToggle && siteNav) {
      navToggle.addEventListener('click', () => {
        const isOpen = siteNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }
  },
};

// Auto-initialize mobile navigation on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  ui.initMobileNav();
});

// Expose globally
window.ui = ui;
