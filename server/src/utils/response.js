/**
 * Bilunex - Standard Response Helper
 * Standardizes API responses across all controllers.
 * Format:
 * Success: { success: true, message: string, data: any }
 * Error:   { success: false, message: string, errors?: any }
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
