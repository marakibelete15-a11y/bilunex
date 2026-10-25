/**
 * Bilunex - Schema Validation Middleware
 * Validates request body, query, and params against Zod schemas.
 * Returns formatted 400 errors if validation fails.
 */

const { sendError } = require('../utils/response');

const validate = schemas => (req, res, next) => {
  try {
    const errorMap = [];

    // Direct Zod schema (defaults to validating req.body)
    if (schemas && typeof schemas.safeParse === 'function') {
      const parsed = schemas.safeParse(req.body);
      if (!parsed.success) {
        parsed.error.issues.forEach(issue => {
          errorMap.push({
            field: issue.path.join('.'),
            message: issue.message,
          });
        });
      } else {
        req.body = parsed.data;
      }
    } else if (schemas && typeof schemas === 'object') {
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          parsed.error.issues.forEach(issue => {
            errorMap.push({
              field: issue.path.join('.'),
              message: issue.message,
            });
          });
        } else {
          req.params = parsed.data;
        }
      }

      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          parsed.error.issues.forEach(issue => {
            errorMap.push({
              field: issue.path.join('.'),
              message: issue.message,
            });
          });
        } else {
          req.query = parsed.data;
        }
      }

      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          parsed.error.issues.forEach(issue => {
            errorMap.push({
              field: issue.path.join('.'),
              message: issue.message,
            });
          });
        } else {
          req.body = parsed.data;
        }
      }
    }

    if (errorMap.length > 0) {
      return sendError(res, 'Validation failed for request data', 400, errorMap);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
