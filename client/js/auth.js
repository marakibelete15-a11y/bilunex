/** Role-specific browser session helpers. Tokens stay in tab-scoped sessionStorage. */
const TOKEN_KEY = 'bilunex_token';
const USER_KEY = 'bilunex_user';

export const auth = {
  setSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  },
  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
  logout(redirectUrl) {
    this.clearSession();
    window.location.assign(redirectUrl);
  },
  protectPage(requiredRole, fallbackLoginUrl) {
    const user = this.getUser();
    const roleMatches =
      requiredRole === 'admin'
        ? user?.role === 'admin' || user?.role === 'super_admin'
        : user?.role === requiredRole;
    if (this.getToken() && roleMatches) return true;
    this.clearSession();
    window.location.replace(fallbackLoginUrl);
    return false;
  },
};
