/**
 * Bilunex - Role-Based Middleware: Require Admin
 * Ensures the authenticated user has an 'admin' role.
 */

const { sendError } = require('../utils/response');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Access restricted to Bilunex administrators.', 403);
  }
  next();
};

module.exports = requireAdmin;
