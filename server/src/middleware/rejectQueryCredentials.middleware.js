const { sendError } = require('../utils/response');

const rejectQueryCredentials = (req, res, next) => {
  const hasCredentialQuery = Object.keys(req.query).some(key =>
    ['email', 'password'].includes(key.toLowerCase())
  );

  if (hasCredentialQuery) {
    return sendError(res, 'Credentials must be sent in the request body.', 400);
  }

  return next();
};

module.exports = rejectQueryCredentials;
