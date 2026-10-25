/**
 * Bilunex - Role-Based Middleware: Require Mentor
 * Ensures the authenticated user has a 'mentor' role.
 * Architecture rule: A mentor can only access their own data.
 */

const { sendError } = require('../utils/response');

const requireMentor = (req, res, next) => {
  if (!req.user || req.user.role !== 'mentor') {
    return sendError(res, 'Access restricted to Bilunex mentors.', 403);
  }
  next();
};

module.exports = requireMentor;
