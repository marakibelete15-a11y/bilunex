/**
 * Bilunex - Session & Authentication Helpers
 * Authentication is managed via httpOnly bilunex_portal_token cookie.
 * Non-sensitive user profile metadata (e.g. name, role) is held in sessionStorage.
 */

const USER_KEY = 'bilunex_user';

export const auth = {
  /**
   * Store user profile metadata in sessionStorage (no tokens).
   * Supports both setSession(user) and legacy setSession(token, user).
   */
  setSession(arg1, arg2) {
    const user = arg2 !== undefined ? arg2 : arg1;
    if (user && typeof user === 'object') {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  setUser(user) {
    if (user && typeof user === 'object') {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  },

  clearSession() {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('bilunex_token'); // Clean up any stale legacy key
  },

  async logout(redirectUrl) {
    const path = window.location.pathname || '';
    const area = path.includes('/admin/') ? 'admin' : 'mentor';
    const fallbackUrl = redirectUrl || `/${area}/login.html`;

    try {
      if (window.apiClient) {
        await window.apiClient.post(`/${area}/auth/logout`);
      } else {
        await fetch(`/api/v1/${area}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      }
    } catch {
      // Local state is cleared even if network fails
    }

    this.clearSession();
    window.location.assign(fallbackUrl);
  },

  protectPage(requiredRole, fallbackLoginUrl) {
    const user = this.getUser();
    const roleMatches =
      requiredRole === 'admin'
        ? user?.role === 'admin' || user?.role === 'super_admin'
        : user?.role === requiredRole;

    if (user && roleMatches) {
      return true;
    }

    this.clearSession();
    window.location.replace(fallbackLoginUrl || `/${requiredRole}/login.html`);
    return false;
  },
};
