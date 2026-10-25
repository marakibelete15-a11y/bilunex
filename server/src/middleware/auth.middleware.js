/**
 * Bilunex - Authentication Middleware
 * Validates incoming JSON Web Tokens (JWT) in Authorization: Bearer <token>
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/response');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access denied. No authentication token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // Contains { id, email, role, mentorId?, etc. }
    next();
  } catch {
    return sendError(res, 'Invalid or expired authentication token.', 403);
  }
};

module.exports = authenticateToken;
