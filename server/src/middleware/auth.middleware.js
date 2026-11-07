/**
 * Bilunex - Authentication Middleware
 * Validates incoming JSON Web Tokens (JWT) in Authorization: Bearer <token>
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/response');

const readCookie = (header, name) => {
  const entry = header
    ?.split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    token = readCookie(req.headers.cookie, 'bilunex_portal_token');
  }

  if (!token) {
    return sendError(res, 'Access denied. No authentication token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // Contains { id, email, role, mentorId?, etc. }
    next();
  } catch {
    return sendError(res, 'Invalid or expired authentication token.', 401);
  }
};

module.exports = authenticateToken;
