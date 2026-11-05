const jwt = require('jsonwebtoken');
const env = require('../config/env');

const readCookie = (header, name) => {
  const entry = header
    ?.split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

const portalPageAuth = requiredRole => (req, res, next) => {
  const pageName = req.path.split('/').pop();
  if (pageName === 'login.html') return next();

  const token = readCookie(req.headers.cookie, 'bilunex_portal_token');
  try {
    const user = token && jwt.verify(token, env.JWT_SECRET);
    const roleMatches =
      requiredRole === 'admin'
        ? user?.role === 'admin' || user?.role === 'super_admin'
        : user?.role === requiredRole;
    if (roleMatches) return next();
  } catch {
    // Invalid and expired portal sessions are handled like unauthenticated requests.
  }

  res.clearCookie('bilunex_portal_token', { path: '/' });
  return res.redirect(302, `/${requiredRole}/login.html`);
};

module.exports = portalPageAuth;
