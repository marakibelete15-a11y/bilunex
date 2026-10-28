/**
 * Bilunex - UI Helpers (ES Module)
 * Accessible alerts, button loading states, and mobile navigation toggling.
 * Enforces rule: Zero innerHTML injection with user text; strictly uses textContent & safe DOM methods.
 */

export const ui = {
  /**
   * Display an accessible alert banner in a target container
   * @param {HTMLElement|string} target - Container element or CSS selector
   * @param {'success'|'error'|'info'|'warning'} type - Alert style
   * @param {string} message - User-facing text message
   * @param {number} [autoDismissMs=0] - Optional timeout to auto-remove alert
   */
  showAlert(target, type, message, autoDismissMs = 0) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;

    // Safely clear existing contents without innerHTML
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type}`;
    alertEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
    alertEl.setAttribute('aria-live', 'polite');

    // Accessible visual status icon indicator
    const iconSpan = document.createElement('span');
    iconSpan.className = 'alert-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';

    const textSpan = document.createElement('span');
    textSpan.className = 'alert-text';
    textSpan.textContent = message; // Safe: textContent prevents XSS injection

    alertEl.appendChild(iconSpan);
    alertEl.appendChild(textSpan);

    container.appendChild(alertEl);

    // Scroll container into view if offscreen
    const rect = container.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (autoDismissMs > 0) {
      setTimeout(() => {
        if (alertEl.parentElement) {
          alertEl.remove();
        }
      }, autoDismissMs);
    }
  },

  /**
   * Clear any active alerts in a container
   * @param {HTMLElement|string} target
   */
  clearAlert(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  },

  /**
   * Toggle accessible button loading state with spinner
   * @param {HTMLButtonElement} buttonEl
   * @param {boolean} isLoading
   * @param {string} [loadingText='Processing...']
   */
  setButtonLoading(buttonEl, isLoading, loadingText = 'Processing...') {
    if (!buttonEl) return;

    if (isLoading) {
      buttonEl.dataset.originalText = buttonEl.textContent.trim();
      buttonEl.disabled = true;
      buttonEl.setAttribute('aria-busy', 'true');

      // Clear button text safely and insert spinner + text
      while (buttonEl.firstChild) {
        buttonEl.removeChild(buttonEl.firstChild);
      }

      const spinner = document.createElement('span');
      spinner.className = 'btn-spinner';
      spinner.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.textContent = ` ${loadingText}`;

      buttonEl.appendChild(spinner);
      buttonEl.appendChild(text);
    } else {
      buttonEl.disabled = false;
      buttonEl.removeAttribute('aria-busy');

      while (buttonEl.firstChild) {
        buttonEl.removeChild(buttonEl.firstChild);
      }
      buttonEl.textContent = buttonEl.dataset.originalText || 'Submit';
    }
  },

  /**
   * Initialize accessible mobile navigation drawer toggle
   */
  initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.querySelector('.primary-nav');

    if (!navToggle || !primaryNav) return;

    const toggleNav = open => {
      const isCurrentlyOpen = navToggle.getAttribute('aria-expanded') === 'true';
      const shouldOpen = typeof open === 'boolean' ? open : !isCurrentlyOpen;

      navToggle.setAttribute('aria-expanded', String(shouldOpen));
      if (shouldOpen) {
        primaryNav.classList.add('is-open');
      } else {
        primaryNav.classList.remove('is-open');
      }
    };

    navToggle.addEventListener('click', e => {
      e.stopPropagation();
      toggleNav();
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        toggleNav(false);
        navToggle.focus();
      }
    });

    // Close menu on click outside
    document.addEventListener('click', e => {
      if (
        navToggle.getAttribute('aria-expanded') === 'true' &&
        !primaryNav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        toggleNav(false);
      }
    });
  },

  /**
   * Detect if site is accessed from non-API development origin (such as VS Code Live Server on port 5500)
   * and show a clear, visible warning banner guiding the developer to port 5000.
   */
  checkOriginBanner() {
    if (typeof window === 'undefined' || !window.location) return;

    const isLiveServer = window.location.port === '5500';
    const isLocalhostMismatched =
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.port !== '5000' &&
      window.location.port !== '';

    if (isLiveServer || isLocalhostMismatched) {
      if (document.getElementById('origin-mismatch-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'origin-mismatch-banner';
      banner.setAttribute('role', 'alert');
      banner.style.cssText =
        'position: sticky; top: 0; left: 0; right: 0; z-index: 999999; background: #c53030; color: #ffffff; padding: 14px 20px; text-align: center; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border-bottom: 2px solid #9b2c2c;';

      const text = document.createElement('span');
      text.textContent = 'Development Notice: The API is not running on this port. ';

      const link = document.createElement('a');
      link.href = 'http://localhost:5000' + window.location.pathname;
      link.textContent = 'Open this site at http://localhost:5000';
      link.style.cssText =
        'color: #ffffff; text-decoration: underline; margin-left: 6px; font-weight: 800;';

      banner.appendChild(text);
      banner.appendChild(link);

      const mount = () => {
        if (document.body && !document.getElementById('origin-mismatch-banner')) {
          document.body.prepend(banner);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
      } else {
        mount();
      }
    }
  },
};

// Global fallback for vanilla non-modular scripts
if (typeof window !== 'undefined') {
  window.ui = ui;
  ui.checkOriginBanner();
}
