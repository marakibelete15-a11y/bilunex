/**
 * Bilunex - Role-Based Middleware: Require Admin
 * Ensures the authenticated user has an 'admin' or 'super_admin' role.
 */

const { sendError } = require('../utils/response');

const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return sendError(res, 'Access restricted to Bilunex administrators.', 403);
  }
  next();
};

module.exports = requireAdmin;
