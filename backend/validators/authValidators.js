/**
 * validators/authValidators.js
 * Joi validation schemas for authentication endpoints.
 *
 * Keeping validation separate from the controller keeps handlers thin
 * and makes schemas independently testable.
 */

import Joi from 'joi';

// ── Reusable field definitions ────────────────────────────────────────────────
const nameField = Joi.string().trim().min(2).max(60).required().messages({
  'string.min': 'Name must be at least 2 characters',
  'string.max': 'Name must be at most 60 characters',
  'any.required': 'Name is required',
});

const emailField = Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
  'string.email': 'Please provide a valid email address',
  'any.required': 'Email is required',
});

const passwordField = Joi.string().min(8).max(128).required().messages({
  'string.min': 'Password must be at least 8 characters',
  'string.max': 'Password must be at most 128 characters',
  'any.required': 'Password is required',
});

// ── Schemas ───────────────────────────────────────────────────────────────────
export const registerSchema = Joi.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your password',
    }),
});

export const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// ── Validation helper ─────────────────────────────────────────────────────────
/**
 * Validates `data` against `schema`.
 * Returns { value, errors } where errors is null on success
 * or an array of human-readable message strings on failure.
 *
 * @param {Joi.Schema} schema
 * @param {object} data
 * @returns {{ value: object, errors: string[] | null }}
 */
export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,   // collect ALL errors, not just the first
    stripUnknown: true,  // drop any extra fields silently
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return { value: null, errors };
  }

  return { value, errors: null };
};
