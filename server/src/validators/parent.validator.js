/**
 * Bilunex - Parent Registration Validator Schema
 */

const { createParentRegistrationSchema } = require('./public.validator');

module.exports = {
  parentRegistrationSchema: createParentRegistrationSchema,
  createParentRegistrationSchema,
};
