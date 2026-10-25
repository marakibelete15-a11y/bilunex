/**
 * Bilunex - Authentication Helpers
 * Client-side token storage, session management, and page protection for Admin & Mentor areas.
 */

const auth = {
  TOKEN_KEY: 'bilunex_token',
  USER_KEY: 'bilunex_user',

  /**
   * Store authentication session
   * @param {string} token - JWT token
   * @param {object} user - User metadata (id, email, role, etc.)
   */
  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  /**
   * Retrieve active JWT token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Retrieve active user data
   * @returns {object|null}
   */
  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is currently authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Clear session and log out
   * @param {string} [redirectUrl] - Where to send user after logout
   */
  logout(redirectUrl = '/') {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = redirectUrl;
  },

  /**
   * Guard protected client pages by role
   * @param {'admin'|'mentor'} requiredRole
   * @param {string} fallbackLoginUrl
   */
  protectPage(requiredRole, fallbackLoginUrl) {
    const user = this.getUser();
    if (!this.isAuthenticated() || !user || user.role !== requiredRole) {
      // Clear any invalid session
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      window.location.href = fallbackLoginUrl;
    }
  },
};

// Expose globally
window.auth = auth;
