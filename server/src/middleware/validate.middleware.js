/**
 * Bilunex - Schema Validation Middleware
 * Validates request payload against a Zod schema and returns formatted 400 errors.
 */

const { sendError } = require('../utils/response');

const validate = schema => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMap = parsed.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, 'Validation failed for request data', 400, errorMap);
    }
    req.body = parsed.data;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
